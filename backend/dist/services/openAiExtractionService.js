"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractWithOpenAi = extractWithOpenAi;
const openai_1 = __importDefault(require("openai"));
const zod_1 = require("zod");
const env_1 = require("../config/env");
const appError_1 = require("../utils/appError");
const extractionService_1 = require("./extractionService");
const llmResponseSchema = zod_1.z.object({
    years: zod_1.z.array(zod_1.z.string().regex(/^(19|20)\d{2}$/)).max(4).optional(),
    currency: zod_1.z.string().optional(),
    units: zod_1.z.string().optional(),
    lineItems: zod_1.z
        .array(zod_1.z.object({
        normalizedLineItem: zod_1.z.string().min(1),
        rawLine: zod_1.z.string().min(1),
        values: zod_1.z.array(zod_1.z.number().finite()).max(4),
        ambiguity: zod_1.z.string().optional(),
        confidence: zod_1.z.number().min(0).max(1).optional(),
    }))
        .default([]),
});
let client = null;
function getClient() {
    if (!env_1.env.openAiApiKey) {
        throw new appError_1.AppError("OPENAI_API_KEY is not configured.", 500);
    }
    if (!client) {
        client = new openai_1.default({ apiKey: env_1.env.openAiApiKey });
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
async function extractWithOpenAi(documentName, rawText) {
    const candidateLines = (0, extractionService_1.selectCandidateFinancialLines)(rawText, 220);
    const fallbackMetadata = {
        documentName,
        years: (0, extractionService_1.detectYears)(rawText),
        currency: (0, extractionService_1.detectCurrency)(rawText),
        units: (0, extractionService_1.detectUnits)(rawText),
    };
    if (!candidateLines.length) {
        return { rows: [], metadata: fallbackMetadata };
    }
    const systemPrompt = `
You are a financial extraction engine.
Return JSON only.
Extract income statement line items from provided lines.
Normalize labels to concise names (Revenue, Cost of Revenue, Gross Profit, Operating Expenses, Operating Income, Net Income, EPS, Other).
Use numbers exactly as present. Do not invent numbers.
If unsure, keep ambiguity text.
  `.trim();
    const userPrompt = `
Document: ${documentName}
Known years (heuristic): ${fallbackMetadata.years.join(", ") || "unknown"}
Known currency (heuristic): ${fallbackMetadata.currency}
Known units (heuristic): ${fallbackMetadata.units}

Financial lines:
${candidateLines.join("\n")}

Return JSON:
{
  "years": ["2023","2022"],
  "currency": "USD|INR|EUR|GBP|UNKNOWN",
  "units": "billions|millions|thousands|unknown",
  "lineItems": [
    {
      "normalizedLineItem": "Revenue",
      "rawLine": "Revenue 383,285 394,328",
      "values": [383285, 394328],
      "ambiguity": "",
      "confidence": 0.92
    }
  ]
}
  `.trim();
    const response = await getClient().chat.completions.create({
        model: env_1.env.openAiModel,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
    });
    const content = response.choices[0]?.message?.content;
    if (!content) {
        throw new appError_1.AppError("OpenAI returned empty content.", 502);
    }
    let parsedUnknown;
    try {
        parsedUnknown = JSON.parse(content);
    }
    catch {
        throw new appError_1.AppError("OpenAI returned non-JSON content.", 502);
    }
    const parsed = llmResponseSchema.safeParse(parsedUnknown);
    if (!parsed.success) {
        throw new appError_1.AppError(`OpenAI JSON schema invalid: ${parsed.error.issues[0]?.message ?? "unknown error"}`, 502);
    }
    const normalizedMetadata = {
        documentName,
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
