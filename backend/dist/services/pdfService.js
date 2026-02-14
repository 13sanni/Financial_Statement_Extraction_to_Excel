"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPdfText = extractPdfText;
const pdf_parse_1 = require("pdf-parse");
async function extractPdfText(buffer) {
    const parser = new pdf_parse_1.PDFParse({ data: buffer });
    try {
        const result = await parser.getText();
        return result.text || "";
    }
    finally {
        await parser.destroy();
    }
}
