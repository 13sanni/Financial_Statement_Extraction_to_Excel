"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildIncomeStatementWorkbook = buildIncomeStatementWorkbook;
const exceljs_1 = __importDefault(require("exceljs"));
function pickPrimaryPeriods(metadata) {
    return metadata
        .map((item) => item.periods || [])
        .sort((a, b) => b.length - a.length)[0]
        ?.slice(0, 8) || [];
}
async function buildIncomeStatementWorkbook(rows, metadata) {
    const workbook = new exceljs_1.default.Workbook();
    const extractionSheet = workbook.addWorksheet("IncomeStatement");
    const metadataSheet = workbook.addWorksheet("Metadata");
    const primaryPeriods = pickPrimaryPeriods(metadata);
    const maxValues = Math.max(1, Math.min(8, Math.max(rows.reduce((max, row) => Math.max(max, row.values.length), 0), primaryPeriods.length)));
    const valueColumns = Array.from({ length: maxValues }, (_, index) => ({
        header: primaryPeriods[index] || `Value ${index + 1}`,
        key: `value${index + 1}`,
        width: 14,
    }));
    extractionSheet.columns = [
        { header: "Document", key: "documentName", width: 28 },
        { header: "Line Item", key: "normalizedLineItem", width: 24 },
        ...valueColumns,
        { header: "Ambiguity Note", key: "ambiguity", width: 36 },
        { header: "Raw Line", key: "rawLine", width: 80 },
    ];
    metadataSheet.columns = [
        { header: "Document", key: "documentName", width: 28 },
        { header: "Detected Periods", key: "periods", width: 28 },
        { header: "Detected Years", key: "years", width: 24 },
        { header: "Detected Currency", key: "currency", width: 20 },
        { header: "Detected Units", key: "units", width: 16 },
    ];
    for (const item of metadata) {
        metadataSheet.addRow({
            documentName: item.documentName,
            periods: item.periods.join(", "),
            years: item.years.join(", "),
            currency: item.currency,
            units: item.units,
        });
    }
    if (!rows.length) {
        extractionSheet.addRow({
            documentName: "",
            normalizedLineItem: "NOT_FOUND",
            ambiguity: "No recognizable income-statement rows were extracted",
            rawLine: "",
        });
    }
    else {
        for (const row of rows) {
            const valueCells = Object.fromEntries(Array.from({ length: maxValues }, (_, index) => [`value${index + 1}`, row.values[index] ?? null]));
            extractionSheet.addRow({
                ...row,
                ...valueCells,
            });
        }
    }
    const excelBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(excelBuffer);
}
