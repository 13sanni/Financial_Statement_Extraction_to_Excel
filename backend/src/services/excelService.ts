import ExcelJS from "exceljs";
import { StatementMetadata, StatementRow } from "../types/statement";

export async function buildIncomeStatementWorkbook(
  rows: StatementRow[],
  metadata: StatementMetadata[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const extractionSheet = workbook.addWorksheet("IncomeStatement");
  const metadataSheet = workbook.addWorksheet("Metadata");
  const metadataByDocument = new Map(metadata.map((item) => [item.documentName, item]));
  const allYears = [...new Set(metadata.flatMap((item) => item.years))]
    .sort((a, b) => Number(b) - Number(a))
    .slice(0, 4);

  const baseColumns: Partial<ExcelJS.Column>[] = [
    { header: "Document", key: "documentName", width: 28 },
    { header: "Line Item", key: "normalizedLineItem", width: 24 },
    { header: "Currency", key: "currency", width: 14 },
    { header: "Units", key: "units", width: 12 },
    { header: "Confidence", key: "confidence", width: 12 },
    { header: "Ambiguity Note", key: "ambiguity", width: 36 },
    { header: "Missing Reason", key: "missingReason", width: 30 },
    { header: "Raw Line", key: "rawLine", width: 80 },
  ];
  const yearColumns: Partial<ExcelJS.Column>[] = allYears.map((year) => ({
    header: year,
    key: `year_${year}`,
    width: 14,
  }));

  extractionSheet.columns = [...baseColumns, ...yearColumns];

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
      confidence: 0,
      ambiguity: "No recognizable income-statement rows were extracted",
      missingReason: "No rows extracted from input document(s)",
      rawLine: "",
    });
  } else {
    for (const row of rows) {
      const rowMetadata = metadataByDocument.get(row.documentName);
      const rowYears = rowMetadata?.years ?? [];
      const yearMappedValues: Record<string, number | null> = {};
      let extraValuesDetected = false;

      for (const year of allYears) {
        yearMappedValues[`year_${year}`] = null;
      }

      for (let i = 0; i < row.values.length; i += 1) {
        const year = rowYears[i];
        if (!year) {
          extraValuesDetected = true;
          continue;
        }
        yearMappedValues[`year_${year}`] = row.values[i] ?? null;
      }

      const missingReason =
        row.normalizedLineItem === "NOT_FOUND"
          ? row.ambiguity
          : rowYears.length === 0
            ? "Detected years missing; values not mapped"
            : "";

      extractionSheet.addRow({
        ...row,
        currency: rowMetadata?.currency ?? "UNKNOWN",
        units: rowMetadata?.units ?? "unknown",
        missingReason,
        ambiguity:
          extraValuesDetected && row.ambiguity
            ? `${row.ambiguity}; values exceeded detected years`
            : extraValuesDetected
              ? "Values exceeded detected years"
              : row.ambiguity,
        ...yearMappedValues,
      });
    }
  }

  const excelBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(excelBuffer);
}
