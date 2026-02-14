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

const MAX_TOTAL_UPLOAD_BYTES = 30 * 1024 * 1024;

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
    if (!files.length) {
      throw new AppError("Please upload at least one PDF in 'documents'.", 400);
    }
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
      throw new AppError("Total upload size exceeded 30MB. Please upload fewer/smaller files.", 413);
    }

    const perFileResults = await Promise.all(
      files.map(async (file) => {
      const text = await extractPdfText(file.buffer);
      const rows = extractStatementRows(file.originalname, text);
        const metadata: StatementMetadata = {
          documentName: file.originalname,
          years: detectYears(text),
          currency: detectCurrency(text),
          units: detectUnits(text),
        };

        const finalRows =
          rows.length > 0
            ? rows
            : [
                {
                  documentName: file.originalname,
                  normalizedLineItem: "NOT_FOUND",
                  rawLine: "",
                  values: [],
                  ambiguity: "No recognizable income-statement rows were extracted",
                  confidence: 0,
                } satisfies StatementRow,
              ];

        return { rows: finalRows, metadata };
      }),
    );

    const allRows = validateStatementRows(perFileResults.flatMap((item) => item.rows));
    const metadata = validateStatementMetadata(perFileResults.map((item) => item.metadata));

    const excelBuffer = await buildIncomeStatementWorkbook(allRows, metadata);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", "attachment; filename=income_statement.xlsx");
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
}
