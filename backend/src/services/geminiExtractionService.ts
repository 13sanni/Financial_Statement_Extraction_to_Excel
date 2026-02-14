import { z } from "zod";
import { env } from "../config/env";
import { StatementMetadata, StatementRow } from "../types/statement";
import { AppError } from "../utils/appError";
import {
  detectCurrency,
  detectUnits,
  detectYears,
  selectCandidateFinancialLines,
} from "./extractionService";

const llmResponseSchema = z.object({
  years: z.array(z.string().regex(/^(19|20)\d{2}$/)).max(4).optional(),
  currency: z.string().optional(),
  units: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        normalizedLineItem: z.string().min(1),
        rawLine: z.string().min(1),
        values: z.array(z.number().finite()).max(4),
        ambiguity: z.string().optional(),
        confidence: z.number().min(0).max(1).optional(),
      }),
    )
    .default([]),
});

const responseJsonSchema = {
  type: "object",
  properties: {
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
          values: { type: "array", items: { type: "number" }, maxItems: 4 },
          ambiguity: { type: "string" },
          confidence: { type: "number" },
        },
        required: ["normalizedLineItem", "rawLine", "values"],
      },
    },
  },
  required: ["lineItems"],
};

type GeminiClient = {
  models: {
    generateContent: (params: {
      model: string;
      contents: string;
      config: {
        temperature: number;
        responseMimeType: string;
        responseJsonSchema: unknown;
      };
    }) => Promise<{ text?: string }>;
  };
};

let client: GeminiClient | null = null;

async function getClient(): Promise<GeminiClient> {
  if (!env.geminiApiKey) {
    throw new AppError("GEMINI_API_KEY is not configured.", 500);
  }
  if (!client) {
    const { GoogleGenAI } = await import("@google/genai");
    client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  }
  return client;
}

function clampConfidence(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0.7;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export async function extractWithGemini(
  documentName: string,
  rawText: string,
): Promise<{ rows: StatementRow[]; metadata: StatementMetadata }> {
  const candidateLines = selectCandidateFinancialLines(rawText, 220);
  const fallbackMetadata: StatementMetadata = {
    documentName,
    years: detectYears(rawText),
    currency: detectCurrency(rawText),
    units: detectUnits(rawText),
  };

  if (!candidateLines.length) {
    return { rows: [], metadata: fallbackMetadata };
  }

  const prompt = `
You are a financial extraction engine.
Return JSON only with this schema.
Extract only income statement line items from provided lines.
Normalize labels to concise names (Revenue, Cost of Revenue, Gross Profit, Operating Expenses, Operating Income, Net Income, EPS, Other).
Use numbers exactly as present. Do not invent numbers.

Document: ${documentName}
Known years (heuristic): ${fallbackMetadata.years.join(", ") || "unknown"}
Known currency (heuristic): ${fallbackMetadata.currency}
Known units (heuristic): ${fallbackMetadata.units}

Financial lines:
${candidateLines.join("\n")}
  `.trim();

  const geminiClient = await getClient();
  const response = await geminiClient.models.generateContent({
    model: env.geminiModel,
    contents: prompt,
    config: {
      temperature: 0,
      responseMimeType: "application/json",
      responseJsonSchema,
    },
  });

  const content = response.text;
  if (!content) {
    throw new AppError("Gemini returned empty content.", 502);
  }

  let parsedUnknown: unknown;
  try {
    parsedUnknown = JSON.parse(content);
  } catch {
    throw new AppError("Gemini returned non-JSON content.", 502);
  }

  const parsed = llmResponseSchema.safeParse(parsedUnknown);
  if (!parsed.success) {
    throw new AppError(
      `Gemini JSON schema invalid: ${parsed.error.issues[0]?.message ?? "unknown error"}`,
      502,
    );
  }

  const normalizedMetadata: StatementMetadata = {
    documentName,
    years: parsed.data.years && parsed.data.years.length ? parsed.data.years : fallbackMetadata.years,
    currency: (parsed.data.currency || fallbackMetadata.currency || "UNKNOWN").toUpperCase(),
    units: (parsed.data.units || fallbackMetadata.units || "unknown").toLowerCase(),
  };

  const rows: StatementRow[] = parsed.data.lineItems.map((item) => ({
    documentName,
    normalizedLineItem: item.normalizedLineItem,
    rawLine: item.rawLine,
    values: item.values,
    ambiguity: item.ambiguity || "",
    confidence: clampConfidence(item.confidence),
  }));

  return { rows, metadata: normalizedMetadata };
}
