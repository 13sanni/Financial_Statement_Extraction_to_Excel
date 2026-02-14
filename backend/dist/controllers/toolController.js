"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMetadata = uploadMetadata;
exports.runIncomeStatementTool = runIncomeStatementTool;
const excelService_1 = require("../services/excelService");
const extractionService_1 = require("../services/extractionService");
const pdfService_1 = require("../services/pdfService");
const validationService_1 = require("../services/validationService");
const appError_1 = require("../utils/appError");
const MAX_TOTAL_UPLOAD_BYTES = 30 * 1024 * 1024;
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
        if (!files.length) {
            throw new appError_1.AppError("Please upload at least one PDF in 'documents'.", 400);
        }
        const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
        if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
            throw new appError_1.AppError("Total upload size exceeded 30MB. Please upload fewer/smaller files.", 413);
        }
        const perFileResults = await Promise.all(files.map(async (file) => {
            const text = await (0, pdfService_1.extractPdfText)(file.buffer);
            const rows = (0, extractionService_1.extractStatementRows)(file.originalname, text);
            const metadata = {
                documentName: file.originalname,
                years: (0, extractionService_1.detectYears)(text),
                currency: (0, extractionService_1.detectCurrency)(text),
                units: (0, extractionService_1.detectUnits)(text),
            };
            const finalRows = rows.length > 0
                ? rows
                : [
                    {
                        documentName: file.originalname,
                        normalizedLineItem: "NOT_FOUND",
                        rawLine: "",
                        values: [],
                        ambiguity: "No recognizable income-statement rows were extracted",
                        confidence: 0,
                    },
                ];
            return { rows: finalRows, metadata };
        }));
        const allRows = (0, validationService_1.validateStatementRows)(perFileResults.flatMap((item) => item.rows));
        const metadata = (0, validationService_1.validateStatementMetadata)(perFileResults.map((item) => item.metadata));
        const excelBuffer = await (0, excelService_1.buildIncomeStatementWorkbook)(allRows, metadata);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=income_statement.xlsx");
        res.send(excelBuffer);
    }
    catch (error) {
        next(error);
    }
}
