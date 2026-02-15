import { Model, Schema, model, models } from "mongoose";

export type ExtractionJobStatus = "queued" | "processing" | "completed" | "failed";

export type ExtractionJobDocument = {
  jobId: string;
  runId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  requestedMode: "auto" | "gemini" | "rule";
  status: ExtractionJobStatus;
  years: string[];
  currency: string;
  units: string;
  extractedRowCount: number;
  warning: string;
  errorMessage: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  outputExcelUrl: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  deletedAt?: Date;
};

const extractionJobSchema = new Schema<ExtractionJobDocument>(
  {
    jobId: { type: String, required: true, unique: true },
    runId: { type: String, required: true, index: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    uploadedBy: { type: String, required: true, default: "System" },
    requestedMode: { type: String, required: true, enum: ["auto", "gemini", "rule"] },
    status: { type: String, required: true, enum: ["queued", "processing", "completed", "failed"] },
    years: [{ type: String, required: true }],
    currency: { type: String, required: true, default: "" },
    units: { type: String, required: true, default: "" },
    extractedRowCount: { type: Number, required: true, default: 0 },
    warning: { type: String, required: true, default: "" },
    errorMessage: { type: String, required: true, default: "" },
    cloudinaryPublicId: { type: String, required: true, default: "" },
    cloudinaryUrl: { type: String, required: true, default: "" },
    outputExcelUrl: { type: String, required: true, default: "" },
    startedAt: { type: Date, required: false },
    completedAt: { type: Date, required: false },
    deletedAt: { type: Date, required: false, default: null },
  },
  { timestamps: true },
);

const existingModel = models.ExtractionJob as Model<ExtractionJobDocument> | undefined;
export const ExtractionJobModel =
  existingModel || model<ExtractionJobDocument>("ExtractionJob", extractionJobSchema);
