"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtractionRunModel = void 0;
const mongoose_1 = require("mongoose");
const uploadedPdfSchema = new mongoose_1.Schema({
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    cloudinaryPublicId: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
    years: [{ type: String, required: true }],
    currency: { type: String, required: true },
    units: { type: String, required: true },
    extractedRowCount: { type: Number, required: true },
}, { _id: false });
const outputExcelSchema = new mongoose_1.Schema({
    fileName: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    cloudinaryPublicId: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
}, { _id: false });
const extractionRunSchema = new mongoose_1.Schema({
    runId: { type: String, required: true, unique: true },
    requestedMode: { type: String, required: true, enum: ["auto", "gemini", "rule"] },
    effectiveMode: { type: String, required: true, enum: ["auto", "gemini", "rule"] },
    status: { type: String, required: true, enum: ["completed", "failed"] },
    warnings: [{ type: String, required: true }],
    totalFiles: { type: Number, required: true },
    totalUploadBytes: { type: Number, required: true },
    uploadedPdfs: { type: [uploadedPdfSchema], required: true },
    outputExcel: { type: outputExcelSchema, required: false },
}, { timestamps: true });
const existingModel = mongoose_1.models.ExtractionRun;
exports.ExtractionRunModel = existingModel || (0, mongoose_1.model)("ExtractionRun", extractionRunSchema);
