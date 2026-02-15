import { z } from "zod";
import { AppError } from "../utils/appError";

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
});

const downloadItemSchema = z.object({
  file: z.string().min(1),
  generatedAt: z.string().min(1),
  size: z.string().min(1),
});

function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? "unknown validation error";
    throw new AppError(`Portal contract violation in ${label}: ${issue}`, 500);
  }
  return parsed.data;
}

export function validatePortalSummary(data: unknown) {
  return parseOrThrow(z.array(summaryCardSchema), data, "summary");
}

export function validatePortalUploadQueue(data: unknown) {
  return parseOrThrow(z.array(uploadQueueItemSchema), data, "upload queue");
}

export function validatePortalRuns(data: unknown) {
  return parseOrThrow(z.array(runItemSchema), data, "runs");
}

export function validatePortalDownloads(data: unknown) {
  return parseOrThrow(z.array(downloadItemSchema), data, "downloads");
}
