import { randomUUID } from "crypto";
import { hasMongoConfig } from "../config/env";
import { ExtractionJobModel } from "../models/extractionJob";

type QueuedJobInput = {
  runId: string;
  requestedMode: "auto" | "gemini" | "rule";
  file: Express.Multer.File;
  uploadedBy: string;
};

type CompleteJobInput = {
  jobId: string;
  years: string[];
  currency: string;
  units: string;
  extractedRowCount: number;
  warning?: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  outputExcelUrl: string;
};

export async function createQueuedJobs(inputs: QueuedJobInput[]): Promise<Array<{ jobId: string }>> {
  if (!hasMongoConfig()) {
    return inputs.map(() => ({ jobId: randomUUID() }));
  }

  const docs = inputs.map((input) => ({
    jobId: randomUUID(),
    runId: input.runId,
    originalName: input.file.originalname,
    mimeType: input.file.mimetype,
    sizeBytes: input.file.size,
    uploadedBy: input.uploadedBy,
    requestedMode: input.requestedMode,
    status: "queued" as const,
    years: [],
    currency: "",
    units: "",
    extractedRowCount: 0,
    warning: "",
    errorMessage: "",
    cloudinaryPublicId: "",
    cloudinaryUrl: "",
    outputExcelUrl: "",
  }));

  const created = await ExtractionJobModel.insertMany(docs);
  return created.map((doc) => ({ jobId: doc.jobId }));
}

export async function markJobProcessing(jobId: string): Promise<void> {
  if (!hasMongoConfig()) return;
  await ExtractionJobModel.updateOne(
    { jobId },
    { $set: { status: "processing", startedAt: new Date(), errorMessage: "" } },
  );
}

export async function markJobCompleted(input: CompleteJobInput): Promise<void> {
  if (!hasMongoConfig()) return;
  await ExtractionJobModel.updateOne(
    { jobId: input.jobId },
    {
      $set: {
        status: "completed",
        years: input.years,
        currency: input.currency,
        units: input.units,
        extractedRowCount: input.extractedRowCount,
        warning: input.warning || "",
        cloudinaryPublicId: input.cloudinaryPublicId,
        cloudinaryUrl: input.cloudinaryUrl,
        outputExcelUrl: input.outputExcelUrl,
        completedAt: new Date(),
      },
    },
  );
}

export async function markJobFailed(jobId: string, errorMessage: string): Promise<void> {
  if (!hasMongoConfig()) return;
  await ExtractionJobModel.updateOne(
    { jobId },
    { $set: { status: "failed", errorMessage: errorMessage.slice(0, 500), completedAt: new Date() } },
  );
}

export async function markRemainingJobsFailed(runId: string, errorMessage: string): Promise<void> {
  if (!hasMongoConfig()) return;
  await ExtractionJobModel.updateMany(
    { runId, status: { $in: ["queued", "processing"] } },
    { $set: { status: "failed", errorMessage: errorMessage.slice(0, 500), completedAt: new Date() } },
  );
}
