"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQueuedJobs = createQueuedJobs;
exports.markJobProcessing = markJobProcessing;
exports.markJobCompleted = markJobCompleted;
exports.markJobFailed = markJobFailed;
exports.markRemainingJobsFailed = markRemainingJobsFailed;
const crypto_1 = require("crypto");
const env_1 = require("../config/env");
const extractionJob_1 = require("../models/extractionJob");
async function createQueuedJobs(inputs) {
    if (!(0, env_1.hasMongoConfig)()) {
        return inputs.map(() => ({ jobId: (0, crypto_1.randomUUID)() }));
    }
    const docs = inputs.map((input) => ({
        jobId: (0, crypto_1.randomUUID)(),
        runId: input.runId,
        originalName: input.file.originalname,
        mimeType: input.file.mimetype,
        sizeBytes: input.file.size,
        uploadedBy: "System",
        requestedMode: input.requestedMode,
        status: "queued",
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
    const created = await extractionJob_1.ExtractionJobModel.insertMany(docs);
    return created.map((doc) => ({ jobId: doc.jobId }));
}
async function markJobProcessing(jobId) {
    if (!(0, env_1.hasMongoConfig)())
        return;
    await extractionJob_1.ExtractionJobModel.updateOne({ jobId }, { $set: { status: "processing", startedAt: new Date(), errorMessage: "" } });
}
async function markJobCompleted(input) {
    if (!(0, env_1.hasMongoConfig)())
        return;
    await extractionJob_1.ExtractionJobModel.updateOne({ jobId: input.jobId }, {
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
    });
}
async function markJobFailed(jobId, errorMessage) {
    if (!(0, env_1.hasMongoConfig)())
        return;
    await extractionJob_1.ExtractionJobModel.updateOne({ jobId }, { $set: { status: "failed", errorMessage: errorMessage.slice(0, 500), completedAt: new Date() } });
}
async function markRemainingJobsFailed(runId, errorMessage) {
    if (!(0, env_1.hasMongoConfig)())
        return;
    await extractionJob_1.ExtractionJobModel.updateMany({ runId, status: { $in: ["queued", "processing"] } }, { $set: { status: "failed", errorMessage: errorMessage.slice(0, 500), completedAt: new Date() } });
}
