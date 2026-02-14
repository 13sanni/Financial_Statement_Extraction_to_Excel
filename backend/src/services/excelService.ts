import ExcelJS from "exceljs";
import { StatementMetadata, StatementRow } from "../types/statement";

export async function buildIncomeStatementWorkbook(
  rows: StatementRow[],
  metadata: StatementMetadata[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const extractionSheet = workbook.addWorksheet("IncomeStatement");
  const metadataSheet = workbook.addWorksheet("Metadata");

  extractionSheet.columns = [
    { header: "Document", key: "documentName", width: 28 },
    { header: "Line Item", key: "normalizedLineItem", width: 24 },
    { header: "Value 1", key: "value1", width: 14 },
    { header: "Value 2", key: "value2", width: 14 },
    { header: "Value 3", key: "value3", width: 14 },
    { header: "Value 4", key: "value4", width: 14 },
    { header: "Ambiguity Note", key: "ambiguity", width: 36 },
    { header: "Raw Line", key: "rawLine", width: 80 },
  ];

  metadataSheet.columns = [
    { header: "Document", key: "documentName", width: 28 },
    { header: "Detected Years", key: "years", width: 24 },
    { header: "Detected Currency", key: "currency", width: 20 },
    { header: "Detected Units", key: "units", width: 16 },
  ];

  for (const item of metadata) {
    metadataSheet.addRow({
      documentName: item.documentName,
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
  } else {
    for (const row of rows) {
      extractionSheet.addRow({
        ...row,
        value1: row.values[0] ?? null,
        value2: row.values[1] ?? null,
        value3: row.values[2] ?? null,
        value4: row.values[3] ?? null,
      });
    }
  }

  const excelBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(excelBuffer);
}
