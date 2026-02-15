"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePortalSummary = validatePortalSummary;
exports.validatePortalUploadQueue = validatePortalUploadQueue;
exports.validatePortalRuns = validatePortalRuns;
exports.validatePortalDownloads = validatePortalDownloads;
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
});
const downloadItemSchema = zod_1.z.object({
    file: zod_1.z.string().min(1),
    generatedAt: zod_1.z.string().min(1),
    size: zod_1.z.string().min(1),
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
    return parseOrThrow(zod_1.z.array(uploadQueueItemSchema), data, "upload queue");
}
function validatePortalRuns(data) {
    return parseOrThrow(zod_1.z.array(runItemSchema), data, "runs");
}
function validatePortalDownloads(data) {
    return parseOrThrow(zod_1.z.array(downloadItemSchema), data, "downloads");
}
