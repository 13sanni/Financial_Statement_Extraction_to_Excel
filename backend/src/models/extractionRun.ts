import { Model, Schema, model, models } from "mongoose";

type UploadedPdfMetadata = {
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

type OutputExcelMetadata = {
  fileName: string;
  sizeBytes: number;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
};

export type ExtractionRunDocument = {
  runId: string;
  requestedMode: "auto" | "gemini" | "rule";
  effectiveMode: "auto" | "gemini" | "rule";
  status: "completed" | "failed";
  warnings: string[];
  totalFiles: number;
  totalUploadBytes: number;
  uploadedPdfs: UploadedPdfMetadata[];
  outputExcel?: OutputExcelMetadata;
  createdAt: Date;
  updatedAt: Date;
};

const uploadedPdfSchema = new Schema<UploadedPdfMetadata>(
  {
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    cloudinaryPublicId: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
    years: [{ type: String, required: true }],
    currency: { type: String, required: true },
    units: { type: String, required: true },
    extractedRowCount: { type: Number, required: true },
  },
  { _id: false },
);

const outputExcelSchema = new Schema<OutputExcelMetadata>(
  {
    fileName: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    cloudinaryPublicId: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
  },
  { _id: false },
);

const extractionRunSchema = new Schema<ExtractionRunDocument>(
  {
    runId: { type: String, required: true, unique: true },
    requestedMode: { type: String, required: true, enum: ["auto", "gemini", "rule"] },
    effectiveMode: { type: String, required: true, enum: ["auto", "gemini", "rule"] },
    status: { type: String, required: true, enum: ["completed", "failed"] },
    warnings: [{ type: String, required: true }],
    totalFiles: { type: Number, required: true },
    totalUploadBytes: { type: Number, required: true },
    uploadedPdfs: { type: [uploadedPdfSchema], required: true },
    outputExcel: { type: outputExcelSchema, required: false },
  },
  { timestamps: true },
);

const existingModel = models.ExtractionRun as Model<ExtractionRunDocument> | undefined;
export const ExtractionRunModel =
  existingModel || model<ExtractionRunDocument>("ExtractionRun", extractionRunSchema);
