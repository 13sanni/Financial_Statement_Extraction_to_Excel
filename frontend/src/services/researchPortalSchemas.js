import { z } from "zod";

const summaryCardSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  delta: z.string().min(1),
});

const uploadQueueItemSchema = z.object({
  company: z.string().min(1),
  period: z.string().min(1),
  pages: z.number().int().nonnegative(),
  uploadedBy: z.string().min(1),
});

const runItemSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1),
  started: z.string().min(1),
  status: z.enum(["processing", "completed", "review"]),
  confidence: z.string().min(1),
  warning: z.string(),
  failureReason: z.string(),
  queuedCount: z.number().int().nonnegative(),
  processingCount: z.number().int().nonnegative(),
  completedCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  progressPercent: z.number().int().min(0).max(100),
  outputExcelUrl: z.string(),
});

const downloadItemSchema = z.object({
  id: z.string().min(1),
  file: z.string().min(1),
  generatedAt: z.string().min(1),
  size: z.string().min(1),
  downloadUrl: z.string().url(),
});

const paginatedResponseSchema = (itemSchema) =>
  z.object({
    items: z.array(itemSchema),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(1),
  });

export const summaryResponseSchema = z.array(summaryCardSchema);
export const uploadQueueResponseSchema = paginatedResponseSchema(uploadQueueItemSchema);
export const runsResponseSchema = paginatedResponseSchema(runItemSchema);
export const downloadsResponseSchema = paginatedResponseSchema(downloadItemSchema);

export const runJobsResponseSchema = z.array(
  z.object({
    jobId: z.string().min(1),
    fileName: z.string().min(1),
    status: z.enum(["queued", "processing", "completed", "failed"]),
    warning: z.string(),
    failureReason: z.string(),
    updatedAt: z.string().min(1),
    outputExcelUrl: z.string(),
  }),
);

export const deleteRunResponseSchema = z.object({
  deleted: z.boolean(),
  runId: z.string().min(1),
});

export const cleanupRunsResponseSchema = z.object({
  olderThanDays: z.number().int().min(1),
  cutoffIso: z.string().min(1),
  deletedRuns: z.number().int().min(0),
  deletedJobs: z.number().int().min(0),
});

export const cleanupAllRunsResponseSchema = z.object({
  deletedRuns: z.number().int().min(0),
  deletedJobs: z.number().int().min(0),
});
