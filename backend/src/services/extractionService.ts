import { StatementRow } from "../types/statement";

const LINE_ITEM_PATTERNS: Array<{ normalized: string; patterns: RegExp[] }> = [
  { normalized: "Revenue", patterns: [/\brevenue\b/i, /\bsales\b/i, /\btotal income\b/i] },
  { normalized: "Cost of Revenue", patterns: [/\bcost of revenue\b/i, /\bcost of sales\b/i] },
  { normalized: "Gross Profit", patterns: [/\bgross profit\b/i] },
  { normalized: "Operating Expenses", patterns: [/\boperating expenses?\b/i, /\boperating costs?\b/i] },
  { normalized: "Operating Income", patterns: [/\boperating income\b/i, /\boperating profit\b/i, /\bebit\b/i] },
  { normalized: "Net Income", patterns: [/\bnet income\b/i, /\bprofit for the year\b/i, /\bprofit attributable\b/i] },
  { normalized: "EPS", patterns: [/\bearnings per share\b/i, /\beps\b/i] },
];

export function detectYears(text: string): string[] {
  const years = new Set<string>();
  const matches = text.match(/\b(19|20)\d{2}\b/g) || [];
  for (const year of matches) {
    years.add(year);
  }
  return [...years].sort((a, b) => Number(b) - Number(a)).slice(0, 4);
}

export function detectCurrency(text: string): string {
  if (/\bUSD\b|\$|US dollars?/i.test(text)) return "USD";
  if (/\bINR\b|Rs\.?|Rupees?/i.test(text)) return "INR";
  if (/\bEUR\b|€|Euros?/i.test(text)) return "EUR";
  if (/\bGBP\b|£|Pounds?/i.test(text)) return "GBP";
  return "UNKNOWN";
}

export function detectUnits(text: string): string {
  if (/\bin billions?\b/i.test(text)) return "billions";
  if (/\bin millions?\b/i.test(text)) return "millions";
  if (/\bin thousands?\b/i.test(text)) return "thousands";
  return "unknown";
}

function extractNumbersFromLine(line: string): number[] {
  const matches = line.match(/\(?-?\d[\d,]*(?:\.\d+)?\)?/g) || [];
  return matches
    .map((token) => {
      const normalized = token.replace(/,/g, "");
      const isNegativeParen = normalized.startsWith("(") && normalized.endsWith(")");
      const stripped = normalized.replace(/[()]/g, "");
      const numeric = Number(stripped);
      if (Number.isNaN(numeric)) return null;
      return isNegativeParen ? -numeric : numeric;
    })
    .filter((value): value is number => value !== null);
}

function detectLineItem(line: string): string | null {
  for (const item of LINE_ITEM_PATTERNS) {
    if (item.patterns.some((pattern) => pattern.test(line))) {
      return item.normalized;
    }
  }
  return null;
}

export function extractStatementRows(documentName: string, text: string): StatementRow[] {
  const rows: StatementRow[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  for (const line of lines) {
    const normalizedLineItem = detectLineItem(line);
    if (!normalizedLineItem) continue;

    const values = extractNumbersFromLine(line);
    if (!values.length) continue;

    rows.push({
      documentName,
      rawLine: line,
      normalizedLineItem,
      values: values.slice(0, 4),
      ambiguity: values.length > 4 ? "More than 4 numeric values found in line" : "",
      confidence: values.length > 4 ? 0.6 : 0.9,
    });
  }
  return rows;
}
