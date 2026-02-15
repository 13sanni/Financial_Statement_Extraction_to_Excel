"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPortalSummary = getPortalSummary;
exports.getPortalUploadQueue = getPortalUploadQueue;
exports.getPortalRuns = getPortalRuns;
exports.getPortalDownloads = getPortalDownloads;
const summaryCards = [
    { label: "Statements Processed", value: "128", delta: "+14 this week" },
    { label: "Queued for Extraction", value: "6", delta: "2 urgent" },
    { label: "Accuracy Score", value: "98.3%", delta: "Last 30 days" },
    { label: "Excel Packages Ready", value: "41", delta: "7 generated today" },
];
const uploadQueue = [
    { company: "North Ridge Energy", period: "Q3 2025", pages: 83, uploadedBy: "A. Reed" },
    { company: "Harbor Capital Bank", period: "FY 2025", pages: 142, uploadedBy: "S. Patel" },
    { company: "Orion Retail Group", period: "Q4 2025", pages: 67, uploadedBy: "J. Kim" },
];
const runs = [
    {
        id: "RUN-2318",
        company: "North Ridge Energy",
        started: "10:32 AM",
        status: "processing",
        confidence: "97.9%",
    },
    {
        id: "RUN-2317",
        company: "Harbor Capital Bank",
        started: "9:58 AM",
        status: "completed",
        confidence: "99.1%",
    },
    {
        id: "RUN-2316",
        company: "Orion Retail Group",
        started: "9:21 AM",
        status: "review",
        confidence: "95.8%",
    },
];
const downloads = [
    { file: "NorthRidge_Q3_2025.xlsx", generatedAt: "Today, 10:41 AM", size: "1.2 MB" },
    { file: "HarborCapital_FY_2025.xlsx", generatedAt: "Today, 10:05 AM", size: "1.8 MB" },
    { file: "OrionRetail_Q4_2025.xlsx", generatedAt: "Today, 9:43 AM", size: "940 KB" },
];
function cloneRows(rows) {
    return rows.map((row) => ({ ...row }));
}
function paginateRows(rows, { page, pageSize }) {
    const totalItems = rows.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const items = rows.slice(start, start + pageSize);
    return { items, page: safePage, pageSize, totalItems, totalPages };
}
function parseSizeToKb(size) {
    const [value, unit] = size.split(" ");
    const numeric = Number.parseFloat(value);
    if (unit === "MB")
        return Math.round(numeric * 1024);
    return Math.round(numeric);
}
function getPortalSummary() {
    return cloneRows(summaryCards);
}
function getPortalUploadQueue(options) {
    const normalizedQuery = options.query.toLowerCase();
    const filtered = cloneRows(uploadQueue)
        .filter((item) => {
        if (!normalizedQuery)
            return true;
        const searchable = `${item.company} ${item.period} ${item.uploadedBy}`.toLowerCase();
        return searchable.includes(normalizedQuery);
    })
        .sort((a, b) => {
        if (options.sort === "pages-desc")
            return b.pages - a.pages;
        if (options.sort === "pages-asc")
            return a.pages - b.pages;
        return a.company.localeCompare(b.company);
    });
    return paginateRows(filtered, options);
}
function getPortalRuns(options) {
    const normalizedQuery = options.query.toLowerCase();
    const filtered = cloneRows(runs).filter((run) => {
        const matchesQuery = !normalizedQuery || `${run.company} ${run.id} ${run.started}`.toLowerCase().includes(normalizedQuery);
        const matchesStatus = options.status === "all" || run.status === options.status;
        return matchesQuery && matchesStatus;
    });
    return paginateRows(filtered, options);
}
function getPortalDownloads(options) {
    const normalizedQuery = options.query.toLowerCase();
    const filtered = cloneRows(downloads)
        .filter((download) => {
        if (!normalizedQuery)
            return true;
        return download.file.toLowerCase().includes(normalizedQuery);
    })
        .sort((a, b) => {
        if (options.sort === "size-desc")
            return parseSizeToKb(b.size) - parseSizeToKb(a.size);
        if (options.sort === "size-asc")
            return parseSizeToKb(a.size) - parseSizeToKb(b.size);
        return b.generatedAt.localeCompare(a.generatedAt);
    });
    return paginateRows(filtered, options);
}
