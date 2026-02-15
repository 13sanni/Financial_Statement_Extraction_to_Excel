"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMetadata = uploadMetadata;
exports.runIncomeStatementTool = runIncomeStatementTool;
const crypto_1 = require("crypto");
const path_1 = __importDefault(require("path"));
const excelService_1 = require("../services/excelService");
const extractionService_1 = require("../services/extractionService");
const pdfService_1 = require("../services/pdfService");
const validationService_1 = require("../services/validationService");
const appError_1 = require("../utils/appError");
const geminiExtractionService_1 = require("../services/geminiExtractionService");
const env_1 = require("../config/env");
const extractionMetadataService_1 = require("../services/extractionMetadataService");
const extractionJobService_1 = require("../services/extractionJobService");
const MAX_TOTAL_UPLOAD_BYTES = 30 * 1024 * 1024;
function parseMode(value) {
    if (value === "gemini" || value === "rule" || value === "auto")
        return value;
    return "auto";
}
function buildDownloadFileName(files) {
    if (files.length === 1) {
        const parsed = path_1.default.parse(files[0].originalname || "income_statement");
        const base = (parsed.name || "income_statement").replace(/[^\w\s.-]/g, "").trim() || "income_statement";
        return `${base}.xlsx`;
    }
    return "income_statement.xlsx";
}
async function extractWithRules(file) {
    const text = await (0, pdfService_1.extractPdfText)(file.buffer);
    const rows = (0, extractionService_1.extractStatementRows)(file.originalname, text);
    const metadata = {
        documentName: file.originalname,
        periods: (0, extractionService_1.detectPeriods)(text),
        years: (0, extractionService_1.detectYears)(text),
        currency: (0, extractionService_1.detectCurrency)(text),
        units: (0, extractionService_1.detectUnits)(text),
    };
    return { rows, metadata };
}
function uploadMetadata(req, res) {
    const files = req.files || [];
    const payload = files.map((file) => ({
        id: file.originalname,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
    }));
    res.json({ count: payload.length, files: payload });
}
async function runIncomeStatementTool(req, res, next) {
    let runId = "";
    try {
        const files = req.files || [];
        runId = (0, crypto_1.randomUUID)();
        const actorEmail = req.user?.email || "System";
        const requestedMode = parseMode(req.query.mode);
        const canUseLlm = (0, env_1.hasGeminiConfig)();
        if (!files.length) {
            throw new appError_1.AppError("Please upload at least one PDF in 'documents'.", 400);
        }
        const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
        if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
            throw new appError_1.AppError("Total upload size exceeded 30MB. Please upload fewer/smaller files.", 413);
        }
        if (requestedMode === "gemini" && !canUseLlm) {
            throw new appError_1.AppError("mode=gemini requested but GEMINI_API_KEY is not configured.", 400);
        }
        let effectiveMode = requestedMode;
        if (requestedMode === "auto") {
            effectiveMode = canUseLlm ? "gemini" : "rule";
        }
        const warnings = new Set();
        warnings.add("Cloud file hosting is disabled. PDF and hosted Excel links are unavailable.");
        const queuedJobs = await (0, extractionJobService_1.createQueuedJobs)(files.map((file) => ({ runId, requestedMode, file, uploadedBy: actorEmail })));
        const perFileResults = await Promise.all(files.map(async (file, index) => {
            const jobId = queuedJobs[index]?.jobId || (0, crypto_1.randomUUID)();
            let fileWarning = "";
            await (0, extractionJobService_1.markJobProcessing)(jobId);
            let extractionResult;
            try {
                if (effectiveMode === "gemini") {
                    extractionResult = await (0, geminiExtractionService_1.extractWithGemini)(file.originalname, await (0, pdfService_1.extractPdfText)(file.buffer), file.buffer);
                }
                else {
                    extractionResult = await extractWithRules(file);
                }
            }
            catch (error) {
                if (effectiveMode === "gemini" && requestedMode === "auto") {
                    fileWarning = `Gemini extraction failed for ${file.originalname}; fallback to rule extraction.`;
                    warnings.add(fileWarning);
                    extractionResult = await extractWithRules(file);
                }
                else {
                    const errorMessage = error instanceof Error ? error.message : "Extraction failed.";
                    await (0, extractionJobService_1.markJobFailed)(jobId, errorMessage);
                    throw error;
                }
            }
            const uploadedPdf = {
                publicId: "",
                secureUrl: "",
                bytes: file.size,
                format: "pdf",
            };
            return { ...extractionResult, uploadedPdf, file, jobId, fileWarning };
        }));
        const normalizedResults = perFileResults.map((item) => {
            if (item.rows.length > 0)
                return item;
            return {
                file: item.file,
                uploadedPdf: item.uploadedPdf,
                metadata: item.metadata,
                jobId: item.jobId,
                fileWarning: item.fileWarning,
                rows: [
                    {
                        documentName: item.metadata.documentName,
                        normalizedLineItem: "NOT_FOUND",
                        rawLine: "",
                        values: [],
                        ambiguity: "No recognizable income-statement rows were extracted",
                        confidence: 0,
                    },
                ],
            };
        });
        const allRows = (0, validationService_1.validateStatementRows)(normalizedResults.flatMap((item) => item.rows));
        const metadata = (0, validationService_1.validateStatementMetadata)(normalizedResults.map((item) => item.metadata));
        const excelBuffer = await (0, excelService_1.buildIncomeStatementWorkbook)(allRows, metadata);
        const uploadedExcel = {
            publicId: "",
            secureUrl: "",
            bytes: excelBuffer.length,
            format: "xlsx",
        };
        await Promise.all(normalizedResults.map((result) => (0, extractionJobService_1.markJobCompleted)({
            jobId: result.jobId,
            years: result.metadata.years,
            currency: result.metadata.currency,
            units: result.metadata.units,
            extractedRowCount: result.rows.length,
            warning: result.fileWarning,
            storagePublicId: result.uploadedPdf.publicId,
            storageUrl: result.uploadedPdf.secureUrl,
            outputExcelUrl: uploadedExcel.secureUrl,
        })));
        try {
            await (0, extractionMetadataService_1.saveExtractionRunMetadata)({
                runId,
                createdBy: actorEmail,
                requestedMode,
                effectiveMode,
                status: "completed",
                warnings: [...warnings],
                totalFiles: files.length,
                totalUploadBytes: totalBytes,
                uploadedPdfs: normalizedResults.map((result) => ({
                    originalName: result.metadata.documentName,
                    mimeType: result.file.mimetype,
                    sizeBytes: result.file.size,
                    storagePublicId: result.uploadedPdf.publicId,
                    storageUrl: result.uploadedPdf.secureUrl,
                    years: result.metadata.years,
                    currency: result.metadata.currency,
                    units: result.metadata.units,
                    extractedRowCount: result.rows.length,
                })),
                outputExcel: {
                    fileName: `income_statement_${runId}.xlsx`,
                    sizeBytes: uploadedExcel.bytes,
                    storagePublicId: uploadedExcel.publicId,
                    storageUrl: uploadedExcel.secureUrl,
                },
            });
        }
        catch (error) {
            warnings.add("Metadata persistence failed for this run.");
            console.error("Failed to save extraction metadata", error);
        }
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${buildDownloadFileName(files)}"`);
        res.setHeader("X-Extraction-Mode", effectiveMode);
        res.setHeader("X-Run-Id", runId);
        res.setHeader("X-Output-Url", uploadedExcel.secureUrl);
        if (warnings.size) {
            res.setHeader("X-Extraction-Warnings", [...warnings].join(" | ").slice(0, 512));
        }
        res.send(excelBuffer);
    }
    catch (error) {
        if (runId) {
            const message = error instanceof Error ? error.message : "Extraction failed.";
            await (0, extractionJobService_1.markRemainingJobsFailed)(runId, message);
        }
        next(error);
    }
}
