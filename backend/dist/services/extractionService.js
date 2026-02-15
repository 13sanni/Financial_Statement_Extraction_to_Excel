"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectYears = detectYears;
exports.detectPeriods = detectPeriods;
exports.detectCurrency = detectCurrency;
exports.detectUnits = detectUnits;
exports.extractStatementRows = extractStatementRows;
exports.selectCandidateFinancialLines = selectCandidateFinancialLines;
const LINE_ITEM_PATTERNS = [
    {
        normalized: "Revenue from Operations",
        patterns: [/\brevenue from (?:operations|ops)\b/i, /\bsales\b/i, /\brevenue\b/i],
    },
    { normalized: "Other Income", patterns: [/\bother income\b/i, /\bother sources?\b/i] },
    { normalized: "Total Income", patterns: [/\btotal income\b/i] },
    {
        normalized: "Cost of Materials Consumed",
        patterns: [/\bcost of materials? consumed\b/i],
    },
    {
        normalized: "Purchases of Stock-in-Trade",
        patterns: [/\bpurchases? of stock[- ]in[- ]trade\b/i],
    },
    {
        normalized: "Change in Inventory",
        patterns: [/\bchanges? in inventories?\b/i, /\bchange in inventory\b/i],
    },
    { normalized: "Cost of Revenue", patterns: [/\bcost of revenue\b/i, /\bcost of sales\b/i] },
    { normalized: "Gross Profit", patterns: [/\bgross profit\b/i] },
    {
        normalized: "Employee Benefits Expense",
        patterns: [/\bemployee benefits? expenses?\b/i, /\bstaff welfare expenses?\b/i],
    },
    { normalized: "Other Expenses", patterns: [/\bother expenses?\b/i] },
    {
        normalized: "Operating Expenses",
        patterns: [/\boperating expenses?\b/i, /\boperating costs?\b/i],
    },
    { normalized: "EBITDA", patterns: [/\bebitda\b/i] },
    { normalized: "Operating Income", patterns: [/\boperating income\b/i, /\boperating profit\b/i, /\bebit\b/i] },
    { normalized: "Finance Costs", patterns: [/\bfinance costs?\b/i, /\binterest expense\b/i] },
    {
        normalized: "Depreciation and Amortization",
        patterns: [/\bdepreciation\b/i, /\bamorti[sz]ation\b/i],
    },
    {
        normalized: "Profit Before Tax",
        patterns: [/\bprofit before tax\b/i, /\bpbt\b/i, /\bearnings before tax\b/i],
    },
    { normalized: "Tax Expense", patterns: [/\btax expenses?\b/i, /\bincome tax\b/i] },
    {
        normalized: "Profit After Tax",
        patterns: [
            /\bprofit after tax\b/i,
            /\bnet income\b/i,
            /\bprofit for the year\b/i,
            /\bprofit attributable\b/i,
        ],
    },
    { normalized: "EPS", patterns: [/\bearnings per share\b/i, /\beps\b/i] },
];
const MIN_REPORTING_YEAR = 1990;
const MAX_REPORTING_YEAR = new Date().getUTCFullYear() + 1;
function findContextSnippets(text) {
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    return lines.filter((line) => /(currency|amounts?\s+in|stated\s+in|presented\s+in|in\s+millions?|in\s+billions?|in\s+thousands?)/i.test(line));
}
function collectYearCounts(source) {
    const counts = new Map();
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
function toSortedYears(counts) {
    return [...counts.entries()]
        .sort((a, b) => {
        if (b[1] !== a[1])
            return b[1] - a[1];
        return b[0] - a[0];
    })
        .map(([year]) => String(year));
}
function detectYears(text) {
    const contextMatches = text.match(/(?:fiscal\s+year|years?\s+ended|year\s+ended|for\s+the\s+years?\s+ended)[^\n]{0,150}/gi);
    if (contextMatches?.length) {
        const contextCounts = collectYearCounts(contextMatches.join("\n"));
        const contextYears = toSortedYears(contextCounts);
        if (contextYears.length) {
            return contextYears.slice(0, 4);
        }
    }
    const globalCounts = collectYearCounts(text);
    const ranked = [...globalCounts.entries()].sort((a, b) => {
        if (b[1] !== a[1])
            return b[1] - a[1];
        return b[0] - a[0];
    });
    const stableYears = ranked.filter(([, count]) => count >= 2).map(([year]) => String(year));
    if (stableYears.length) {
        return stableYears.slice(0, 4);
    }
    return ranked.map(([year]) => String(year)).slice(0, 4);
}
function detectPeriods(text) {
    const fyMatches = text.match(/\b(?:Q[1-4]\s*)?FY\s*'?\d{2,4}\b/gi) || [];
    const normalized = fyMatches.map((token) => token
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase()
        .replace(/^Q([1-4])\s*FY\s*'?(\d{2,4})$/, "Q$1 FY$2")
        .replace(/^FY\s*'?(\d{2,4})$/, "FY$1"));
    const unique = [...new Set(normalized)];
    if (unique.length) {
        return unique.slice(0, 8);
    }
    return detectYears(text).slice(0, 8);
}
function detectCurrency(text) {
    const snippets = findContextSnippets(text).join("\n");
    const source = snippets || text;
    if (/\b(USD|US dollars?|U\.S\. dollars?)\b/i.test(source))
        return "USD";
    if (/\b(INR|Indian rupees?|Rupees?)\b|(?:^|[^\w])Rs\.?(?:[^\w]|$)/i.test(source))
        return "INR";
    if (/\b(EUR|Euros?)\b/i.test(source))
        return "EUR";
    if (/\b(GBP|Pounds? sterling)\b/i.test(source))
        return "GBP";
    // Symbol-only fallback if no explicit currency text was found.
    if (/\$/i.test(source))
        return "USD";
    if (/€/i.test(source))
        return "EUR";
    if (/£/i.test(source))
        return "GBP";
    return "UNKNOWN";
}
function detectUnits(text) {
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
function extractNumbersFromLine(line) {
    const matches = line.match(/\(?-?\d[\d,]*(?:\.\d+)?\)?/g) || [];
    return matches
        .map((token) => {
        const normalized = token.replace(/,/g, "");
        const isNegativeParen = normalized.startsWith("(") && normalized.endsWith(")");
        const stripped = normalized.replace(/[()]/g, "");
        const numeric = Number(stripped);
        if (Number.isNaN(numeric))
            return null;
        return isNegativeParen ? -numeric : numeric;
    })
        .filter((value) => value !== null);
}
function detectLineItem(line) {
    for (const item of LINE_ITEM_PATTERNS) {
        if (item.patterns.some((pattern) => pattern.test(line))) {
            return item.normalized;
        }
    }
    return null;
}
function extractStatementRows(documentName, text) {
    const rows = [];
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter(Boolean);
    for (const line of lines) {
        const normalizedLineItem = detectLineItem(line);
        if (!normalizedLineItem)
            continue;
        const values = extractNumbersFromLine(line);
        if (!values.length)
            continue;
        rows.push({
            documentName,
            rawLine: line,
            normalizedLineItem,
            values: values.slice(0, 8),
            ambiguity: values.length > 8 ? "More than 8 numeric values found in line" : "",
            confidence: values.length > 8 ? 0.6 : 0.9,
        });
    }
    return rows;
}
function selectCandidateFinancialLines(text, maxLines = 220) {
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter(Boolean);
    const financialLines = lines.filter((line) => {
        const hasMoneyToken = /\(?-?\d[\d,]*(?:\.\d+)?\)?/.test(line);
        const hasKeyword = /\b(revenue|sales|income|expense|profit|loss|operating|ebit|ebitda|eps|earnings|cost|tax|depreciation|finance)\b/i.test(line);
        return hasMoneyToken && hasKeyword;
    });
    return financialLines.slice(0, maxLines);
}
