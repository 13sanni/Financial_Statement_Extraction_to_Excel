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

const MIN_REPORTING_YEAR = 1990;
const MAX_REPORTING_YEAR = new Date().getUTCFullYear() + 1;

function findContextSnippets(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.filter((line) =>
    /(currency|amounts?\s+in|stated\s+in|presented\s+in|in\s+millions?|in\s+billions?|in\s+thousands?)/i.test(
      line,
    ),
  );
}

function collectYearCounts(source: string): Map<number, number> {
  const counts = new Map<number, number>();
  const matches = source.match(/\b(19\d{2}|20\d{2})\b/g) || [];
  for (const token of matches) {
    const year = Number(token);
    if (year < MIN_REPORTING_YEAR || year > MAX_REPORTING_YEAR) {
      continue;
    }
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }
  return counts;
}

function toSortedYears(counts: Map<number, number>): string[] {
  return [...counts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return b[0] - a[0];
    })
    .map(([year]) => String(year));
}

export function detectYears(text: string): string[] {
  const contextMatches = text.match(
    /(?:fiscal\s+year|years?\s+ended|year\s+ended|for\s+the\s+years?\s+ended)[^\n]{0,150}/gi,
  );

  if (contextMatches?.length) {
    const contextCounts = collectYearCounts(contextMatches.join("\n"));
    const contextYears = toSortedYears(contextCounts);
    if (contextYears.length) {
      return contextYears.slice(0, 4);
    }
  }

  const globalCounts = collectYearCounts(text);
  const ranked = [...globalCounts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });
  const stableYears = ranked.filter(([, count]) => count >= 2).map(([year]) => String(year));
  if (stableYears.length) {
    return stableYears.slice(0, 4);
  }

  return ranked.map(([year]) => String(year)).slice(0, 4);
}

export function detectCurrency(text: string): string {
  const snippets = findContextSnippets(text).join("\n");
  const source = snippets || text;

  if (/\b(USD|US dollars?|U\.S\. dollars?)\b/i.test(source)) return "USD";
  if (/\b(INR|Indian rupees?|Rupees?)\b|(?:^|[^\w])Rs\.?(?:[^\w]|$)/i.test(source)) return "INR";
  if (/\b(EUR|Euros?)\b/i.test(source)) return "EUR";
  if (/\b(GBP|Pounds? sterling)\b/i.test(source)) return "GBP";

  // Symbol-only fallback if no explicit currency text was found.
  if (/\$/i.test(source)) return "USD";
  if (/€/i.test(source)) return "EUR";
  if (/£/i.test(source)) return "GBP";
  return "UNKNOWN";
}

export function detectUnits(text: string): string {
  const snippets = findContextSnippets(text).join("\n");
  const source = snippets || text;

  if (/\b(amounts?|figures?|statements?|values?)\s+(are\s+)?(?:presented|stated|reported)?\s*in\s+billions?\b/i.test(source) || /\bin\s+billions?\b/i.test(source)) {
    return "billions";
  }
  if (/\b(amounts?|figures?|statements?|values?)\s+(are\s+)?(?:presented|stated|reported)?\s*in\s+millions?\b/i.test(source) || /\bin\s+millions?\b/i.test(source)) {
    return "millions";
  }
  if (/\b(amounts?|figures?|statements?|values?)\s+(are\s+)?(?:presented|stated|reported)?\s*in\s+thousands?\b/i.test(source) || /\bin\s+thousands?\b/i.test(source)) {
    return "thousands";
  }
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

export function selectCandidateFinancialLines(text: string, maxLines = 220): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const financialLines = lines.filter((line) => {
    const hasMoneyToken = /\(?-?\d[\d,]*(?:\.\d+)?\)?/.test(line);
    const hasKeyword =
      /\b(revenue|sales|income|expense|profit|loss|operating|ebit|eps|earnings|cost)\b/i.test(
        line,
      );
    return hasMoneyToken && hasKeyword;
  });
  return financialLines.slice(0, maxLines);
}
