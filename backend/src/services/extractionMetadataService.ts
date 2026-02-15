import { hasMongoConfig } from "../config/env";
import { ExtractionRunModel } from "../models/extractionRun";

type UploadedPdfRecordInput = {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  years: string[];
  currency: string;
  units: string;
  extractedRowCount: number;
};

type OutputExcelRecordInput = {
  fileName: string;
  sizeBytes: number;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
};

type ExtractionRunRecordInput = {
  runId: string;
  requestedMode: "auto" | "gemini" | "rule";
  effectiveMode: "auto" | "gemini" | "rule";
  status: "completed" | "failed";
  warnings: string[];
  totalFiles: number;
  totalUploadBytes: number;
  uploadedPdfs: UploadedPdfRecordInput[];
  outputExcel?: OutputExcelRecordInput;
};

export async function saveExtractionRunMetadata(input: ExtractionRunRecordInput): Promise<void> {
  if (!hasMongoConfig()) return;
  await ExtractionRunModel.create(input);
}
