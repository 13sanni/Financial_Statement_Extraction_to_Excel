import { hasMongoConfig } from "../config/env";
import { ExtractionJobModel } from "../models/extractionJob";
import { ExtractionRunModel } from "../models/extractionRun";

type SummaryCard = {
  label: string;
  value: string;
  delta: string;
};

type UploadQueueItem = {
  company: string;
  period: string;
  pages: number;
  uploadedBy: string;
};

type RunItem = {
  id: string;
  company: string;
  started: string;
  status: "processing" | "completed" | "review";
  confidence: string;
  warning: string;
  failureReason: string;
  queuedCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
};

type DownloadItem = {
  id: string;
  file: string;
  generatedAt: string;
  size: string;
  downloadUrl: string;
};

type PaginationOptions = {
  page: number;
  pageSize: number;
};

type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type UploadQueueOptions = PaginationOptions & {
  query: string;
  sort: "company" | "pages-desc" | "pages-asc";
};

type RunsOptions = PaginationOptions & {
  query: string;
  status: "all" | "processing" | "completed" | "review";
};

type DownloadsOptions = PaginationOptions & {
  query: string;
  sort: "recent" | "size-desc" | "size-asc";
};

type RunRecord = {
  runId: string;
  status: "completed" | "failed";
  warnings: string[];
  createdAt: Date;
  uploadedPdfs: Array<{
    originalName: string;
    extractedRowCount: number;
    years: string[];
  }>;
  outputExcel?: { fileName: string; sizeBytes: number; cloudinaryUrl: string } | undefined;
};

type JobRecord = {
  jobId: string;
  runId: string;
  status: "queued" | "processing" | "completed" | "failed";
  originalName: string;
  uploadedBy: string;
  years: string[];
  extractedRowCount: number;
  warning: string;
  errorMessage: string;
  createdAt: Date;
};

function paginateRows<T>(rows: T[], { page, pageSize }: PaginationOptions): PaginatedResult<T> {
  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);
  return { items, page: safePage, pageSize, totalItems, totalPages };
}

function parseSizeToKb(size: string): number {
  const [value, unit] = size.split(" ");
  const numeric = Number.parseFloat(value);
  if (unit === "MB") return Math.round(numeric * 1024);
  return Math.round(numeric);
}

function humanizeFileName(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, "");
  const clean = withoutExt.replace(/[_-]+/g, " ").trim();
  return clean || fileName;
}

function formatPeriod(years: string[]): string {
  if (!years.length) return "Unknown Period";
  const sorted = [...years].sort((a, b) => Number(b) - Number(a));
  return `FY ${sorted[0]}`;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function calculateRunConfidencePercent(run: RunRecord): string {
  const total = run.uploadedPdfs.length;
  if (!total) return "0.0%";
  const successful = run.uploadedPdfs.filter((item) => item.extractedRowCount > 0).length;
  return `${((successful / total) * 100).toFixed(1)}%`;
}

async function loadRunsFromDb(): Promise<RunRecord[]> {
  if (!hasMongoConfig()) return [];
  const rows = await ExtractionRunModel.find()
    .sort({ createdAt: -1 })
    .select({
      runId: 1,
      status: 1,
      warnings: 1,
      createdAt: 1,
      uploadedPdfs: 1,
      outputExcel: 1,
      _id: 0,
    })
    .lean<RunRecord[]>();
  return rows;
}

async function loadJobsFromDb(): Promise<JobRecord[]> {
  if (!hasMongoConfig()) return [];
  const rows = await ExtractionJobModel.find()
    .sort({ createdAt: -1 })
    .select({
      jobId: 1,
      runId: 1,
      status: 1,
      originalName: 1,
      uploadedBy: 1,
      years: 1,
      extractedRowCount: 1,
      warning: 1,
      errorMessage: 1,
      createdAt: 1,
      _id: 0,
    })
    .lean<JobRecord[]>();
  return rows;
}

export async function getPortalSummary(): Promise<SummaryCard[]> {
  const [runs, jobs] = await Promise.all([loadRunsFromDb(), loadJobsFromDb()]);
  const statementsProcessed = runs.reduce((sum, run) => sum + run.uploadedPdfs.length, 0);
  const completedRuns = runs.filter((run) => run.status === "completed").length;
  const failedRuns = runs.filter((run) => run.status === "failed").length;
  const queuedJobs = jobs.filter((job) => job.status === "queued" || job.status === "processing").length;
  const totalRuns = completedRuns + failedRuns;
  const successRate = totalRuns ? ((completedRuns / totalRuns) * 100).toFixed(1) : "0.0";
  const exportsReady = runs.filter((run) => Boolean(run.outputExcel)).length;

  return [
    {
      label: "Statements Processed",
      value: String(statementsProcessed),
      delta: `${completedRuns} completed runs`,
    },
    {
      label: "Queued for Extraction",
      value: String(queuedJobs),
      delta: queuedJobs ? "Live jobs in pipeline" : "No queued jobs",
    },
    {
      label: "Accuracy Score",
      value: `${successRate}%`,
      delta: "Run success rate",
    },
    {
      label: "Excel Packages Ready",
      value: String(exportsReady),
      delta: `${failedRuns} failed runs`,
    },
  ];
}

export async function getPortalUploadQueue(options: UploadQueueOptions): Promise<PaginatedResult<UploadQueueItem>> {
  const jobs = await loadJobsFromDb();
  const uploadQueue = jobs
    .filter((job) => job.status === "queued" || job.status === "processing")
    .map((job) => ({
      company: humanizeFileName(job.originalName),
      period: formatPeriod(job.years),
      pages: job.extractedRowCount,
      uploadedBy: job.uploadedBy || "System",
    }));

  const normalizedQuery = options.query.toLowerCase();
  const filtered = uploadQueue
    .filter((item) => {
      if (!normalizedQuery) return true;
      const searchable = `${item.company} ${item.period} ${item.uploadedBy}`.toLowerCase();
      return searchable.includes(normalizedQuery);
    })
    .sort((a, b) => {
      if (options.sort === "pages-desc") return b.pages - a.pages;
      if (options.sort === "pages-asc") return a.pages - b.pages;
      return a.company.localeCompare(b.company);
    });

  return paginateRows(filtered, options);
}

export async function getPortalRuns(options: RunsOptions): Promise<PaginatedResult<RunItem>> {
  const [runs, jobs] = await Promise.all([loadRunsFromDb(), loadJobsFromDb()]);
  const jobsByRun = jobs.reduce((acc, job) => {
    const list = acc.get(job.runId) || [];
    list.push(job);
    acc.set(job.runId, list);
    return acc;
  }, new Map<string, JobRecord[]>());

  function countStatuses(runId: string) {
    const items = jobsByRun.get(runId) || [];
    return {
      queuedCount: items.filter((job) => job.status === "queued").length,
      processingCount: items.filter((job) => job.status === "processing").length,
      completedCount: items.filter((job) => job.status === "completed").length,
      failedCount: items.filter((job) => job.status === "failed").length,
    };
  }

  const failedReasonByRun = jobs
    .filter((job) => job.status === "failed" && job.errorMessage)
    .reduce((acc, job) => {
      if (!acc.has(job.runId)) acc.set(job.runId, job.errorMessage);
      return acc;
    }, new Map<string, string>());

  const completedRunItems: RunItem[] = runs.map((run) => {
    const statusCounts = countStatuses(run.runId);
    return {
      id: run.runId,
      company: run.uploadedPdfs[0] ? humanizeFileName(run.uploadedPdfs[0].originalName) : "Unknown Company",
      started: formatTime(run.createdAt),
      status: run.status === "failed" ? "review" : "completed",
      confidence: calculateRunConfidencePercent(run),
      warning: run.warnings.join(" | "),
      failureReason: run.status === "failed" ? failedReasonByRun.get(run.runId) || "Run failed." : "",
      queuedCount: statusCounts.queuedCount,
      processingCount: statusCounts.processingCount,
      completedCount: statusCounts.completedCount || run.uploadedPdfs.length,
      failedCount: statusCounts.failedCount,
    };
  });
  const activeJobGroups = jobs
    .filter((job) => job.status === "queued" || job.status === "processing")
    .reduce((acc, job) => {
      const list = acc.get(job.runId) || [];
      list.push(job);
      acc.set(job.runId, list);
      return acc;
    }, new Map<string, JobRecord[]>());

  const activeRunItems: RunItem[] = [...activeJobGroups.entries()].map(([runId, groupedJobs]) => {
    const first = groupedJobs[0];
    const warningText = groupedJobs.map((job) => job.warning).filter(Boolean).join(" | ");
    const failureReason = groupedJobs.find((job) => job.errorMessage)?.errorMessage || "";
    const statusCounts = countStatuses(runId);
    return {
      id: runId,
      company: humanizeFileName(first?.originalName || "Unknown Company"),
      started: formatTime(first?.createdAt || new Date()),
      status: "processing",
      confidence: "In Progress",
      warning: warningText,
      failureReason,
      queuedCount: statusCounts.queuedCount,
      processingCount: statusCounts.processingCount,
      completedCount: statusCounts.completedCount,
      failedCount: statusCounts.failedCount,
    };
  });

  const runItems = [...activeRunItems, ...completedRunItems];

  const normalizedQuery = options.query.toLowerCase();
  const filtered = runItems.filter((run) => {
    const matchesQuery =
      !normalizedQuery || `${run.company} ${run.id} ${run.started}`.toLowerCase().includes(normalizedQuery);
    const matchesStatus = options.status === "all" || run.status === options.status;
    return matchesQuery && matchesStatus;
  });

  return paginateRows(filtered, options);
}

export async function getPortalDownloads(options: DownloadsOptions): Promise<PaginatedResult<DownloadItem>> {
  const downloads: DownloadItem[] = (await loadRunsFromDb())
    .filter((run) => Boolean(run.outputExcel?.cloudinaryUrl))
    .map((run) => ({
      id: run.runId,
      file: run.outputExcel?.fileName || `income_statement_${run.runId}.xlsx`,
      generatedAt: formatDateTime(run.createdAt),
      size: formatBytes(run.outputExcel?.sizeBytes || 0),
      downloadUrl: run.outputExcel?.cloudinaryUrl as string,
    }));

  const normalizedQuery = options.query.toLowerCase();
  const filtered = downloads
    .filter((download) => {
      if (!normalizedQuery) return true;
      return download.file.toLowerCase().includes(normalizedQuery);
    })
    .sort((a, b) => {
      if (options.sort === "size-desc") return parseSizeToKb(b.size) - parseSizeToKb(a.size);
      if (options.sort === "size-asc") return parseSizeToKb(a.size) - parseSizeToKb(b.size);
      return b.generatedAt.localeCompare(a.generatedAt);
    });

  return paginateRows(filtered, options);
}
