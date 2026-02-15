"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtractionJobModel = void 0;
const mongoose_1 = require("mongoose");
const extractionJobSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
const existingModel = mongoose_1.models.ExtractionJob;
exports.ExtractionJobModel = existingModel || (0, mongoose_1.model)("ExtractionJob", extractionJobSchema);
