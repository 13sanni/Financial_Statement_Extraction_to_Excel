import { NextFunction, Request, Response } from "express";
import { buildIncomeStatementWorkbook } from "../services/excelService";
import {
  detectCurrency,
  detectUnits,
  detectYears,
  extractStatementRows,
} from "../services/extractionService";
import { extractPdfText } from "../services/pdfService";
import { validateStatementMetadata, validateStatementRows } from "../services/validationService";
import { StatementMetadata, StatementRow } from "../types/statement";
import { AppError } from "../utils/appError";
import { extractWithGemini } from "../services/geminiExtractionService";
import { hasGeminiConfig } from "../config/env";

const MAX_TOTAL_UPLOAD_BYTES = 30 * 1024 * 1024;
type ExtractionMode = "auto" | "gemini" | "rule";

function parseMode(value: unknown): ExtractionMode {
  if (value === "gemini" || value === "rule" || value === "auto") return value;
  return "auto";
}

async function extractWithRules(file: Express.Multer.File): Promise<{ rows: StatementRow[]; metadata: StatementMetadata }> {
  const text = await extractPdfText(file.buffer);
  const rows = extractStatementRows(file.originalname, text);
  const metadata: StatementMetadata = {
    documentName: file.originalname,
    years: detectYears(text),
    currency: detectCurrency(text),
    units: detectUnits(text),
  };
  return { rows, metadata };
}

export function uploadMetadata(req: Request, res: Response): void {
  const files = (req.files as Express.Multer.File[]) || [];
  const payload = files.map((file) => ({
    id: file.originalname,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
  }));
  res.json({ count: payload.length, files: payload });
}

export async function runIncomeStatementTool(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    const requestedMode = parseMode(req.query.mode);
    const canUseLlm = hasGeminiConfig();
    if (!files.length) {
      throw new AppError("Please upload at least one PDF in 'documents'.", 400);
    }
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
      throw new AppError("Total upload size exceeded 30MB. Please upload fewer/smaller files.", 413);
    }

    if (requestedMode === "gemini" && !canUseLlm) {
      throw new AppError("mode=gemini requested but GEMINI_API_KEY is not configured.", 400);
    }

    let effectiveMode: ExtractionMode = requestedMode;
    if (requestedMode === "auto") {
      effectiveMode = canUseLlm ? "gemini" : "rule";
    }

    const warnings = new Set<string>();
    const perFileResults = await Promise.all(
      files.map(async (file) => {
        try {
          if (effectiveMode === "gemini") {
            return await extractWithGemini(file.originalname, await extractPdfText(file.buffer));
          }
          return await extractWithRules(file);
        } catch (error) {
          if (effectiveMode === "gemini" && requestedMode === "auto") {
            warnings.add(
              `Gemini extraction failed for ${file.originalname}; fallback to rule extraction.`,
            );
            return await extractWithRules(file);
          }
          throw error;
        }
      }),
    );

    const normalizedResults = perFileResults.map((item) => {
      if (item.rows.length > 0) return item;
      return {
        metadata: item.metadata,
        rows: [
          {
            documentName: item.metadata.documentName,
            normalizedLineItem: "NOT_FOUND",
            rawLine: "",
            values: [],
            ambiguity: "No recognizable income-statement rows were extracted",
            confidence: 0,
          } satisfies StatementRow,
        ],
      };
    });

    const allRows = validateStatementRows(normalizedResults.flatMap((item) => item.rows));
    const metadata = validateStatementMetadata(normalizedResults.map((item) => item.metadata));

    const excelBuffer = await buildIncomeStatementWorkbook(allRows, metadata);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", "attachment; filename=income_statement.xlsx");
    res.setHeader("X-Extraction-Mode", effectiveMode);
    if (warnings.size) {
      res.setHeader("X-Extraction-Warnings", [...warnings].join(" | ").slice(0, 512));
    }
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
}
