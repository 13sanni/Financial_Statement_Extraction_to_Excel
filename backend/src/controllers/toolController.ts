import { randomUUID } from "crypto";
import path from "path";
import { NextFunction, Request, Response } from "express";
import { buildIncomeStatementWorkbook } from "../services/excelService";
import {
  detectPeriods,
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
import { saveExtractionRunMetadata } from "../services/extractionMetadataService";
import {
  createQueuedJobs,
  markJobCompleted,
  markJobFailed,
  markJobProcessing,
  markRemainingJobsFailed,
} from "../services/extractionJobService";

const MAX_TOTAL_UPLOAD_BYTES = 30 * 1024 * 1024;
type ExtractionMode = "auto" | "gemini" | "rule";

function parseMode(value: unknown): ExtractionMode {
  if (value === "gemini" || value === "rule" || value === "auto") return value;
  return "auto";
}

function buildDownloadFileName(files: Express.Multer.File[]): string {
  if (files.length === 1) {
    const parsed = path.parse(files[0].originalname || "income_statement");
    const base = (parsed.name || "income_statement").replace(/[^\w\s.-]/g, "").trim() || "income_statement";
    return `${base}.xlsx`;
  }
  return "income_statement.xlsx";
}

async function extractWithRules(file: Express.Multer.File): Promise<{ rows: StatementRow[]; metadata: StatementMetadata }> {
  const text = await extractPdfText(file.buffer);
  const rows = extractStatementRows(file.originalname, text);
  const metadata: StatementMetadata = {
    documentName: file.originalname,
    periods: detectPeriods(text),
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
  let runId = "";
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    runId = randomUUID();
    const actorEmail = req.user?.email || "System";
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
    warnings.add("Cloud file hosting is disabled. PDF and hosted Excel links are unavailable.");
    const queuedJobs = await createQueuedJobs(
      files.map((file) => ({ runId, requestedMode, file, uploadedBy: actorEmail })),
    );
    const perFileResults = await Promise.all(
      files.map(async (file, index) => {
        const jobId = queuedJobs[index]?.jobId || randomUUID();
        let fileWarning = "";
        await markJobProcessing(jobId);

        let extractionResult: { rows: StatementRow[]; metadata: StatementMetadata };
        try {
          if (effectiveMode === "gemini") {
            extractionResult = await extractWithGemini(
              file.originalname,
              await extractPdfText(file.buffer),
              file.buffer,
            );
          } else {
            extractionResult = await extractWithRules(file);
          }
        } catch (error) {
          if (effectiveMode === "gemini" && requestedMode === "auto") {
            fileWarning = `Gemini extraction failed for ${file.originalname}; fallback to rule extraction.`;
            warnings.add(fileWarning);
            extractionResult = await extractWithRules(file);
          } else {
            const errorMessage = error instanceof Error ? error.message : "Extraction failed.";
            await markJobFailed(jobId, errorMessage);
            throw error;
          }
        }

        const uploadedPdf = {
          publicId: "",
          secureUrl: "",
          bytes: file.size,
          format: "pdf",
        };

        return { ...extractionResult, uploadedPdf, file, jobId, fileWarning };
      }),
    );

    const normalizedResults = perFileResults.map((item) => {
      if (item.rows.length > 0) return item;
      return {
        file: item.file,
        uploadedPdf: item.uploadedPdf,
        metadata: item.metadata,
        jobId: item.jobId,
        fileWarning: item.fileWarning,
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
    const uploadedExcel = {
      publicId: "",
      secureUrl: "",
      bytes: excelBuffer.length,
      format: "xlsx",
    };

    await Promise.all(
      normalizedResults.map((result) =>
        markJobCompleted({
          jobId: result.jobId,
          years: result.metadata.years,
          currency: result.metadata.currency,
          units: result.metadata.units,
          extractedRowCount: result.rows.length,
          warning: result.fileWarning,
          storagePublicId: result.uploadedPdf.publicId,
          storageUrl: result.uploadedPdf.secureUrl,
          outputExcelUrl: uploadedExcel.secureUrl,
        }),
      ),
    );

    try {
      await saveExtractionRunMetadata({
        runId,
        createdBy: actorEmail,
        requestedMode,
        effectiveMode,
        status: "completed",
        warnings: [...warnings],
        totalFiles: files.length,
        totalUploadBytes: totalBytes,
        uploadedPdfs: normalizedResults.map((result) => ({
          originalName: result.metadata.documentName,
          mimeType: result.file.mimetype,
          sizeBytes: result.file.size,
          storagePublicId: result.uploadedPdf.publicId,
          storageUrl: result.uploadedPdf.secureUrl,
          years: result.metadata.years,
          currency: result.metadata.currency,
          units: result.metadata.units,
          extractedRowCount: result.rows.length,
        })),
        outputExcel: {
          fileName: `income_statement_${runId}.xlsx`,
          sizeBytes: uploadedExcel.bytes,
          storagePublicId: uploadedExcel.publicId,
          storageUrl: uploadedExcel.secureUrl,
        },
      });
    } catch (error) {
      warnings.add("Metadata persistence failed for this run.");
      console.error("Failed to save extraction metadata", error);
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${buildDownloadFileName(files)}"`);
    res.setHeader("X-Extraction-Mode", effectiveMode);
    res.setHeader("X-Run-Id", runId);
    res.setHeader("X-Output-Url", uploadedExcel.secureUrl);
    if (warnings.size) {
      res.setHeader("X-Extraction-Warnings", [...warnings].join(" | ").slice(0, 512));
    }
    res.send(excelBuffer);
  } catch (error) {
    if (runId) {
      const message = error instanceof Error ? error.message : "Extraction failed.";
      await markRemainingJobsFailed(runId, message);
    }
    next(error);
  }
}
