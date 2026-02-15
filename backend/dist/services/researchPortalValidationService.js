"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePortalSummary = validatePortalSummary;
exports.validatePortalUploadQueue = validatePortalUploadQueue;
exports.validatePortalRuns = validatePortalRuns;
exports.validatePortalDownloads = validatePortalDownloads;
exports.validatePortalUploadQueueQuery = validatePortalUploadQueueQuery;
exports.validatePortalRunsQuery = validatePortalRunsQuery;
exports.validatePortalDownloadsQuery = validatePortalDownloadsQuery;
exports.validatePortalRunJobs = validatePortalRunJobs;
exports.validatePortalRunIdParam = validatePortalRunIdParam;
const zod_1 = require("zod");
const appError_1 = require("../utils/appError");
const summaryCardSchema = zod_1.z.object({
    label: zod_1.z.string().min(1),
    value: zod_1.z.string().min(1),
    delta: zod_1.z.string().min(1),
});
const uploadQueueItemSchema = zod_1.z.object({
    company: zod_1.z.string().min(1),
    period: zod_1.z.string().min(1),
    pages: zod_1.z.number().int().nonnegative(),
    uploadedBy: zod_1.z.string().min(1),
});
const runItemSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    company: zod_1.z.string().min(1),
    started: zod_1.z.string().min(1),
    status: zod_1.z.enum(["processing", "completed", "review"]),
    confidence: zod_1.z.string().min(1),
    warning: zod_1.z.string(),
    failureReason: zod_1.z.string(),
    queuedCount: zod_1.z.number().int().nonnegative(),
    processingCount: zod_1.z.number().int().nonnegative(),
    completedCount: zod_1.z.number().int().nonnegative(),
    failedCount: zod_1.z.number().int().nonnegative(),
    progressPercent: zod_1.z.number().int().min(0).max(100),
    outputExcelUrl: zod_1.z.string(),
});
const downloadItemSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    file: zod_1.z.string().min(1),
    generatedAt: zod_1.z.string().min(1),
    size: zod_1.z.string().min(1),
    downloadUrl: zod_1.z.string().url(),
});
const paginatedResponseSchema = (itemSchema) => zod_1.z.object({
    items: zod_1.z.array(itemSchema),
    page: zod_1.z.number().int().min(1),
    pageSize: zod_1.z.number().int().min(1),
    totalItems: zod_1.z.number().int().min(0),
    totalPages: zod_1.z.number().int().min(1),
});
const paginationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(50).default(5),
});
const uploadQueueQuerySchema = paginationQuerySchema.extend({
    query: zod_1.z.string().trim().optional().default(""),
    sort: zod_1.z.enum(["company", "pages-desc", "pages-asc"]).default("company"),
});
const runsQuerySchema = paginationQuerySchema.extend({
    query: zod_1.z.string().trim().optional().default(""),
    status: zod_1.z.enum(["all", "processing", "completed", "review"]).default("all"),
    sort: zod_1.z.enum(["recent", "progress-desc", "progress-asc"]).default("recent"),
});
const downloadsQuerySchema = paginationQuerySchema.extend({
    query: zod_1.z.string().trim().optional().default(""),
    sort: zod_1.z.enum(["recent", "size-desc", "size-asc"]).default("recent"),
});
const runJobItemSchema = zod_1.z.object({
    jobId: zod_1.z.string().min(1),
    fileName: zod_1.z.string().min(1),
    status: zod_1.z.enum(["queued", "processing", "completed", "failed"]),
    warning: zod_1.z.string(),
    failureReason: zod_1.z.string(),
    updatedAt: zod_1.z.string().min(1),
    sourcePdfUrl: zod_1.z.string(),
    outputExcelUrl: zod_1.z.string(),
});
const runIdParamSchema = zod_1.z.object({
    runId: zod_1.z.string().min(1),
});
function parseOrThrow(schema, data, label) {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
        const issue = parsed.error.issues[0]?.message ?? "unknown validation error";
        throw new appError_1.AppError(`Portal contract violation in ${label}: ${issue}`, 500);
    }
    return parsed.data;
}
function validatePortalSummary(data) {
    return parseOrThrow(zod_1.z.array(summaryCardSchema), data, "summary");
}
function validatePortalUploadQueue(data) {
    return parseOrThrow(paginatedResponseSchema(uploadQueueItemSchema), data, "upload queue");
}
function validatePortalRuns(data) {
    return parseOrThrow(paginatedResponseSchema(runItemSchema), data, "runs");
}
function validatePortalDownloads(data) {
    return parseOrThrow(paginatedResponseSchema(downloadItemSchema), data, "downloads");
}
function validatePortalUploadQueueQuery(data) {
    return parseOrThrow(uploadQueueQuerySchema, data, "upload queue query");
}
function validatePortalRunsQuery(data) {
    return parseOrThrow(runsQuerySchema, data, "runs query");
}
function validatePortalDownloadsQuery(data) {
    return parseOrThrow(downloadsQuerySchema, data, "downloads query");
}
function validatePortalRunJobs(data) {
    return parseOrThrow(zod_1.z.array(runJobItemSchema), data, "run jobs");
}
function validatePortalRunIdParam(data) {
    return parseOrThrow(runIdParamSchema, data, "run id param");
}
