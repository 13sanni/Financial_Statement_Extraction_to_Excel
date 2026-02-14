const fs = require("fs");
const path = require("path");
const { extractPdfText } = require("../dist/services/pdfService");
const {
  extractStatementRows,
  detectYears,
  detectCurrency,
  detectUnits,
} = require("../dist/services/extractionService");
const {
  validateStatementRows,
  validateStatementMetadata,
} = require("../dist/services/validationService");
const { buildIncomeStatementWorkbook } = require("../dist/services/excelService");

async function run() {
  const pdfPath = path.join(process.cwd(), "testdata", "sample_annual_report.pdf");
  const outPath = path.join(process.cwd(), "testdata", "income_statement_test.xlsx");
  const buffer = fs.readFileSync(pdfPath);
  const text = await extractPdfText(buffer);

  const rows = extractStatementRows("sample_annual_report.pdf", text);
  const metadata = [
    {
      documentName: "sample_annual_report.pdf",
      years: detectYears(text),
      currency: detectCurrency(text),
      units: detectUnits(text),
    },
  ];

  const validRows = validateStatementRows(
    rows.length
      ? rows
      : [
          {
            documentName: "sample_annual_report.pdf",
            normalizedLineItem: "NOT_FOUND",
            rawLine: "",
            values: [],
            ambiguity: "No recognizable income-statement rows were extracted",
            confidence: 0,
          },
        ],
  );
  const validMetadata = validateStatementMetadata(metadata);

  const excel = await buildIncomeStatementWorkbook(validRows, validMetadata);
  fs.writeFileSync(outPath, excel);

  console.log(
    JSON.stringify(
      {
        ok: true,
        textLength: text.length,
        extractedRows: rows.length,
        detectedYears: metadata[0].years,
        detectedCurrency: metadata[0].currency,
        detectedUnits: metadata[0].units,
        outputFile: outPath,
        outputBytes: excel.length,
      },
      null,
      2,
    ),
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
