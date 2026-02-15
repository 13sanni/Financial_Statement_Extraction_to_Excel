"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStatementRows = validateStatementRows;
exports.validateStatementMetadata = validateStatementMetadata;
const zod_1 = require("zod");
const appError_1 = require("../utils/appError");
const statementRowSchema = zod_1.z.object({
    documentName: zod_1.z.string().min(1),
    rawLine: zod_1.z.string(),
    normalizedLineItem: zod_1.z.string().min(1),
    values: zod_1.z.array(zod_1.z.number().finite()).max(8),
    ambiguity: zod_1.z.string(),
    confidence: zod_1.z.number().min(0).max(1),
});
const statementMetadataSchema = zod_1.z.object({
    documentName: zod_1.z.string().min(1),
    periods: zod_1.z.array(zod_1.z.string().min(1)).max(8),
    years: zod_1.z.array(zod_1.z.string().min(1)).max(8),
    currency: zod_1.z.string().min(1),
    units: zod_1.z.string().min(1),
});
function validateStatementRows(rows) {
    const parsed = zod_1.z.array(statementRowSchema).safeParse(rows);
    if (!parsed.success) {
        throw new appError_1.AppError(`Invalid extracted row format: ${parsed.error.issues[0]?.message ?? "unknown error"}`, 422);
    }
    return parsed.data;
}
function validateStatementMetadata(metadata) {
    const parsed = zod_1.z.array(statementMetadataSchema).safeParse(metadata);
    if (!parsed.success) {
        throw new appError_1.AppError(`Invalid extracted metadata format: ${parsed.error.issues[0]?.message ?? "unknown error"}`, 422);
    }
    return parsed.data;
}
