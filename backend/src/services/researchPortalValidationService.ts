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

const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(1),
  });

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(5),
});

const uploadQueueQuerySchema = paginationQuerySchema.extend({
  query: z.string().trim().optional().default(""),
  sort: z.enum(["company", "pages-desc", "pages-asc"]).default("company"),
});

const runsQuerySchema = paginationQuerySchema.extend({
  query: z.string().trim().optional().default(""),
  status: z.enum(["all", "processing", "completed", "review"]).default("all"),
});

const downloadsQuerySchema = paginationQuerySchema.extend({
  query: z.string().trim().optional().default(""),
  sort: z.enum(["recent", "size-desc", "size-asc"]).default("recent"),
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
  return parseOrThrow(paginatedResponseSchema(uploadQueueItemSchema), data, "upload queue");
}

export function validatePortalRuns(data: unknown) {
  return parseOrThrow(paginatedResponseSchema(runItemSchema), data, "runs");
}

export function validatePortalDownloads(data: unknown) {
  return parseOrThrow(paginatedResponseSchema(downloadItemSchema), data, "downloads");
}

export function validatePortalUploadQueueQuery(data: unknown) {
  return parseOrThrow(uploadQueueQuerySchema, data, "upload queue query");
}

export function validatePortalRunsQuery(data: unknown) {
  return parseOrThrow(runsQuerySchema, data, "runs query");
}

export function validatePortalDownloadsQuery(data: unknown) {
  return parseOrThrow(downloadsQuerySchema, data, "downloads query");
}
