"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractWithGemini = extractWithGemini;
const zod_1 = require("zod");
const env_1 = require("../config/env");
const appError_1 = require("../utils/appError");
const extractionService_1 = require("./extractionService");
const llmResponseSchema = zod_1.z.object({
    periods: zod_1.z.array(zod_1.z.string().min(1)).max(8).optional(),
    years: zod_1.z.array(zod_1.z.string().regex(/^(19|20)\d{2}$/)).max(4).optional(),
    currency: zod_1.z.string().optional(),
    units: zod_1.z.string().optional(),
    lineItems: zod_1.z
        .array(zod_1.z.object({
        normalizedLineItem: zod_1.z.string().min(1),
        rawLine: zod_1.z.string().min(1),
        values: zod_1.z.array(zod_1.z.number().finite()).max(8),
        ambiguity: zod_1.z.string().optional(),
        confidence: zod_1.z.number().min(0).max(1).optional(),
    }))
        .default([]),
});
const responseJsonSchema = {
    type: "object",
    properties: {
        periods: {
            type: "array",
            items: { type: "string" },
            maxItems: 8,
        },
        years: {
            type: "array",
            items: { type: "string", pattern: "^(19|20)\\d{2}$" },
            maxItems: 4,
        },
        currency: { type: "string" },
        units: { type: "string" },
        lineItems: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    normalizedLineItem: { type: "string" },
                    rawLine: { type: "string" },
                    values: { type: "array", items: { type: "number" }, maxItems: 8 },
                    ambiguity: { type: "string" },
                    confidence: { type: "number" },
                },
                required: ["normalizedLineItem", "rawLine", "values"],
            },
        },
    },
    required: ["lineItems"],
};
let client = null;
async function getClient() {
    if (!env_1.env.geminiApiKey) {
        throw new appError_1.AppError("GEMINI_API_KEY is not configured.", 500);
    }
    if (!client) {
        const { GoogleGenAI } = await import("@google/genai");
        client = new GoogleGenAI({ apiKey: env_1.env.geminiApiKey });
    }
    return client;
}
function clampConfidence(value) {
    if (typeof value !== "number" || Number.isNaN(value))
        return 0.7;
    if (value < 0)
        return 0;
    if (value > 1)
        return 1;
    return value;
}
async function extractWithGemini(documentName, rawText, pdfBuffer) {
    const candidateLines = (0, extractionService_1.selectCandidateFinancialLines)(rawText, 220);
    const fallbackMetadata = {
        documentName,
        periods: (0, extractionService_1.detectPeriods)(rawText),
        years: (0, extractionService_1.detectYears)(rawText),
        currency: (0, extractionService_1.detectCurrency)(rawText),
        units: (0, extractionService_1.detectUnits)(rawText),
    };
    if (!candidateLines.length && !pdfBuffer) {
        return { rows: [], metadata: fallbackMetadata };
    }
    const prompt = `
You are a financial extraction engine.
Return JSON only with this schema.
Extract only income statement line items for a multi-period statement.
Normalize labels to concise names such as:
Revenue from Operations, Other Income, Total Income, Cost of Materials Consumed,
Purchases of Stock-in-Trade, Change in Inventory, Gross Profit, Employee Benefits Expense,
Other Expenses, EBITDA, Operating Income, Finance Costs, Depreciation and Amortization,
Profit Before Tax, Tax Expense, Profit After Tax, EPS, Other.
Use numbers exactly as present. Do not invent numbers.
If periods are visible (for example FY25, Q1 FY26, 2025), return them in order in 'periods'.
Extract up to 8 values per line item.

Document: ${documentName}
Known years (heuristic): ${fallbackMetadata.years.join(", ") || "unknown"}
Known periods (heuristic): ${fallbackMetadata.periods.join(", ") || "unknown"}
Known currency (heuristic): ${fallbackMetadata.currency}
Known units (heuristic): ${fallbackMetadata.units}

${candidateLines.length ? `Financial lines:\n${candidateLines.join("\n")}` : "No extracted text lines were available. Read directly from the PDF document part."}
  `.trim();
    const geminiClient = await getClient();
    const contents = pdfBuffer && !candidateLines.length
        ? [
            prompt,
            {
                inlineData: {
                    data: pdfBuffer.toString("base64"),
                    mimeType: "application/pdf",
                },
            },
        ]
        : prompt;
    const response = await geminiClient.models.generateContent({
        model: env_1.env.geminiModel,
        contents,
        config: {
            temperature: 0,
            responseMimeType: "application/json",
            responseJsonSchema,
        },
    });
    const content = response.text;
    if (!content) {
        throw new appError_1.AppError("Gemini returned empty content.", 502);
    }
    let parsedUnknown;
    try {
        parsedUnknown = JSON.parse(content);
    }
    catch {
        throw new appError_1.AppError("Gemini returned non-JSON content.", 502);
    }
    const parsed = llmResponseSchema.safeParse(parsedUnknown);
    if (!parsed.success) {
        throw new appError_1.AppError(`Gemini JSON schema invalid: ${parsed.error.issues[0]?.message ?? "unknown error"}`, 502);
    }
    const normalizedMetadata = {
        documentName,
        periods: parsed.data.periods && parsed.data.periods.length
            ? parsed.data.periods
            : fallbackMetadata.periods,
        years: parsed.data.years && parsed.data.years.length ? parsed.data.years : fallbackMetadata.years,
        currency: (parsed.data.currency || fallbackMetadata.currency || "UNKNOWN").toUpperCase(),
        units: (parsed.data.units || fallbackMetadata.units || "unknown").toLowerCase(),
    };
    const rows = parsed.data.lineItems.map((item) => ({
        documentName,
        normalizedLineItem: item.normalizedLineItem,
        rawLine: item.rawLine,
        values: item.values,
        ambiguity: item.ambiguity || "",
        confidence: clampConfidence(item.confidence),
    }));
    return { rows, metadata: normalizedMetadata };
}
