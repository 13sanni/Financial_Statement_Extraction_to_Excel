"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMetadata = uploadMetadata;
exports.runIncomeStatementTool = runIncomeStatementTool;
const excelService_1 = require("../services/excelService");
const extractionService_1 = require("../services/extractionService");
const pdfService_1 = require("../services/pdfService");
const validationService_1 = require("../services/validationService");
const appError_1 = require("../utils/appError");
const geminiExtractionService_1 = require("../services/geminiExtractionService");
const env_1 = require("../config/env");
const MAX_TOTAL_UPLOAD_BYTES = 30 * 1024 * 1024;
function parseMode(value) {
    if (value === "gemini" || value === "rule" || value === "auto")
        return value;
    return "auto";
}
async function extractWithRules(file) {
    const text = await (0, pdfService_1.extractPdfText)(file.buffer);
    const rows = (0, extractionService_1.extractStatementRows)(file.originalname, text);
    const metadata = {
        documentName: file.originalname,
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
    try {
        const files = req.files || [];
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
        const perFileResults = await Promise.all(files.map(async (file) => {
            try {
                if (effectiveMode === "gemini") {
                    return await (0, geminiExtractionService_1.extractWithGemini)(file.originalname, await (0, pdfService_1.extractPdfText)(file.buffer));
                }
                return await extractWithRules(file);
            }
            catch (error) {
                if (effectiveMode === "gemini" && requestedMode === "auto") {
                    warnings.add(`Gemini extraction failed for ${file.originalname}; fallback to rule extraction.`);
                    return await extractWithRules(file);
                }
                throw error;
            }
        }));
        const normalizedResults = perFileResults.map((item) => {
            if (item.rows.length > 0)
                return item;
            return {
                metadata: item.metadata,
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
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=income_statement.xlsx");
        res.setHeader("X-Extraction-Mode", effectiveMode);
        if (warnings.size) {
            res.setHeader("X-Extraction-Warnings", [...warnings].join(" | ").slice(0, 512));
        }
        res.send(excelBuffer);
    }
    catch (error) {
        next(error);
    }
}
