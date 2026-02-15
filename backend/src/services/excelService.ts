import ExcelJS from "exceljs";
import { StatementMetadata, StatementRow } from "../types/statement";

const MAX_VALUE_COLUMNS = 8;

function sanitizeWorksheetName(value: string): string {
  const cleaned = value.replace(/[\\/*?:[\]]/g, " ").trim();
  return (cleaned || "IncomeStatement").slice(0, 31);
}

function getDistinctDocuments(rows: StatementRow[], metadata: StatementMetadata[]): string[] {
  const ordered = new Set<string>();
  for (const item of metadata) ordered.add(item.documentName);
  for (const item of rows) ordered.add(item.documentName);
  return [...ordered];
}

function buildPeriodHeaders(periods: string[], valuesInRows: number): string[] {
  const maxValues = Math.max(
    1,
    Math.min(
      MAX_VALUE_COLUMNS,
      Math.max(valuesInRows, periods.length),
    ),
  );
  return Array.from({ length: maxValues }, (_, index) => periods[index] || `Value ${index + 1}`);
}

export async function buildIncomeStatementWorkbook(
  rows: StatementRow[],
  metadata: StatementMetadata[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const metadataByDocument = new Map(metadata.map((item) => [item.documentName, item]));
  const documents = getDistinctDocuments(rows, metadata);
  const usedSheetNames = new Set<string>();

  if (!documents.length) {
    const extractionSheet = workbook.addWorksheet("IncomeStatement");
    extractionSheet.columns = [{ header: "Particulars", key: "lineItem", width: 40 }];
    extractionSheet.addRow({ lineItem: "NOT_FOUND" });
  } else {
    for (const documentName of documents) {
      const rowGroup = rows.filter((item) => item.documentName === documentName);
      const periods = metadataByDocument.get(documentName)?.periods || [];
      const headers = buildPeriodHeaders(
        periods,
        rowGroup.reduce((max, item) => Math.max(max, item.values.length), 0),
      );
      const baseSheetName =
        documents.length === 1 ? "Sheet1" : sanitizeWorksheetName(documentName);
      let sheetName = baseSheetName;
      let index = 2;
      while (usedSheetNames.has(sheetName)) {
        const suffix = `_${index}`;
        sheetName = `${baseSheetName.slice(0, 31 - suffix.length)}${suffix}`;
        index += 1;
      }
      usedSheetNames.add(sheetName);

      const extractionSheet = workbook.addWorksheet(sheetName);
      extractionSheet.columns = [
        { header: "Particulars", key: "lineItem", width: 42 },
        ...headers.map((header, headerIndex) => ({
          header,
          key: `value${headerIndex + 1}`,
          width: 14,
        })),
      ];

      const headerRow = extractionSheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF5B1E44" },
      };
      extractionSheet.views = [{ state: "frozen", ySplit: 1 }];

      if (!rowGroup.length) {
        const emptyRowValues = Object.fromEntries(headers.map((_, idx) => [`value${idx + 1}`, null]));
        extractionSheet.addRow({
          lineItem: "NOT_FOUND",
          ...emptyRowValues,
        });
        continue;
      }

      for (const row of rowGroup) {
        const valueCells = Object.fromEntries(
          headers.map((_, headerIndex) => [`value${headerIndex + 1}`, row.values[headerIndex] ?? null]),
        );
        extractionSheet.addRow({
          lineItem: row.normalizedLineItem,
          ...valueCells,
        });
      }
    }
  }

  if (!rows.length && !metadata.length) {
    const fallbackSheet = workbook.getWorksheet("IncomeStatement") || workbook.addWorksheet("IncomeStatement");
    if (fallbackSheet.rowCount === 0) {
      fallbackSheet.columns = [{ header: "Particulars", key: "lineItem", width: 42 }];
      fallbackSheet.addRow({
        lineItem: "NOT_FOUND",
      });
      const headerRow = fallbackSheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF5B1E44" },
      };
      fallbackSheet.views = [{ state: "frozen", ySplit: 1 }];
    }
  }

  const excelBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(excelBuffer);
}
