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
  progressPercent: number;
  outputExcelUrl: string;
};

type DownloadItem = {
  id: string;
  file: string;
  generatedAt: string;
  size: string;
  downloadUrl: string;
};

type RunJobItem = {
  jobId: string;
  fileName: string;
  status: "queued" | "processing" | "completed" | "failed";
  warning: string;
  failureReason: string;
  updatedAt: string;
  outputExcelUrl: string;
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
  sort: "recent" | "progress-desc" | "progress-asc";
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
    storageUrl: string;
  }>;
  outputExcel?: { fileName: string; sizeBytes: number; storageUrl: string } | undefined;
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
  storagePublicId: string;
  storageUrl: string;
  outputExcelUrl: string;
  createdAt: Date;
  updatedAt: Date;
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
  const rows = await ExtractionRunModel.find({ deletedAt: null })
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
  const rows = await ExtractionJobModel.find({ deletedAt: null })
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
      storagePublicId: 1,
      storageUrl: 1,
      outputExcelUrl: 1,
      createdAt: 1,
      updatedAt: 1,
      _id: 0,
    })
    .lean<JobRecord[]>();
  return rows;
}

export async function getPortalRunJobs(runId: string): Promise<RunJobItem[]> {
  const jobs = (await loadJobsFromDb())
    .filter((job) => job.runId === runId)
    .map((job) => ({
      jobId: job.jobId,
      fileName: job.originalName,
      status: job.status,
      warning: job.warning || "",
      failureReason: job.errorMessage || "",
      updatedAt: formatDateTime(job.updatedAt || job.createdAt),
      outputExcelUrl: job.outputExcelUrl || "",
    }));
  return jobs;
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

  function calculateProgressPercent(statusCounts: {
    queuedCount: number;
    processingCount: number;
    completedCount: number;
    failedCount: number;
  }): number {
    const total =
      statusCounts.queuedCount +
      statusCounts.processingCount +
      statusCounts.completedCount +
      statusCounts.failedCount;
    if (!total) return 0;
    const done = statusCounts.completedCount + statusCounts.failedCount;
    return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
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
      progressPercent:
        statusCounts.completedCount ||
        statusCounts.failedCount ||
        statusCounts.processingCount ||
        statusCounts.queuedCount
          ? calculateProgressPercent({
              ...statusCounts,
              completedCount: statusCounts.completedCount || run.uploadedPdfs.length,
            })
          : 100,
      outputExcelUrl: run.outputExcel?.storageUrl || "",
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
      progressPercent: calculateProgressPercent(statusCounts),
      outputExcelUrl: "",
    };
  });

  const runItems = [...activeRunItems, ...completedRunItems];

  const normalizedQuery = options.query.toLowerCase();
  const filtered = runItems.filter((run) => {
    const matchesQuery =
      !normalizedQuery || `${run.company} ${run.id} ${run.started}`.toLowerCase().includes(normalizedQuery);
    const matchesStatus = options.status === "all" || run.status === options.status;
    return matchesQuery && matchesStatus;
  })
    .sort((a, b) => {
      if (options.sort === "progress-desc") return b.progressPercent - a.progressPercent;
      if (options.sort === "progress-asc") return a.progressPercent - b.progressPercent;
      return 0;
    });

  return paginateRows(filtered, options);
}

export async function getPortalDownloads(options: DownloadsOptions): Promise<PaginatedResult<DownloadItem>> {
  const downloads: DownloadItem[] = (await loadRunsFromDb())
    .filter((run) => Boolean(run.outputExcel?.storageUrl))
    .map((run) => ({
      id: run.runId,
      file: run.outputExcel?.fileName || `income_statement_${run.runId}.xlsx`,
      generatedAt: formatDateTime(run.createdAt),
      size: formatBytes(run.outputExcel?.sizeBytes || 0),
      downloadUrl: run.outputExcel?.storageUrl as string,
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

export async function deletePortalRun(runId: string): Promise<{ deleted: boolean; runId: string }> {
  if (!hasMongoConfig()) {
    return { deleted: false, runId };
  }

  const run = await ExtractionRunModel.findOne({ runId, deletedAt: null });
  const jobs = await ExtractionJobModel.find({ runId, deletedAt: null }).lean();

  if (!run && !jobs.length) return { deleted: false, runId };

  const now = new Date();
  await Promise.all([
    ExtractionRunModel.updateOne({ runId }, { $set: { deletedAt: now } }),
    ExtractionJobModel.updateMany({ runId }, { $set: { deletedAt: now } }),
  ]);

  return {
    deleted: true,
    runId,
  };
}

export async function deleteOlderPortalRuns(olderThanDays: number): Promise<{
  olderThanDays: number;
  cutoffIso: string;
  deletedRuns: number;
  deletedJobs: number;
}> {
  if (!hasMongoConfig()) {
    return {
      olderThanDays,
      cutoffIso: new Date().toISOString(),
      deletedRuns: 0,
      deletedJobs: 0,
    };
  }

  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const runsToDelete = await ExtractionRunModel.find({
    deletedAt: null,
    createdAt: { $lt: cutoff },
  })
    .select({ runId: 1, _id: 0 })
    .lean<Array<{ runId: string }>>();

  const runIds = runsToDelete.map((row) => row.runId);
  if (!runIds.length) {
    return {
      olderThanDays,
      cutoffIso: cutoff.toISOString(),
      deletedRuns: 0,
      deletedJobs: 0,
    };
  }

  const now = new Date();
  const [runUpdate, jobUpdate] = await Promise.all([
    ExtractionRunModel.updateMany(
      { runId: { $in: runIds }, deletedAt: null },
      { $set: { deletedAt: now } },
    ),
    ExtractionJobModel.updateMany(
      { runId: { $in: runIds }, deletedAt: null },
      { $set: { deletedAt: now } },
    ),
  ]);

  return {
    olderThanDays,
    cutoffIso: cutoff.toISOString(),
    deletedRuns: runUpdate.modifiedCount || 0,
    deletedJobs: jobUpdate.modifiedCount || 0,
  };
}

export async function deleteAllPortalRuns(): Promise<{ deletedRuns: number; deletedJobs: number }> {
  if (!hasMongoConfig()) {
    return { deletedRuns: 0, deletedJobs: 0 };
  }

  const now = new Date();
  const [runUpdate, jobUpdate] = await Promise.all([
    ExtractionRunModel.updateMany({ deletedAt: null }, { $set: { deletedAt: now } }),
    ExtractionJobModel.updateMany({ deletedAt: null }, { $set: { deletedAt: now } }),
  ]);

  return {
    deletedRuns: runUpdate.modifiedCount || 0,
    deletedJobs: jobUpdate.modifiedCount || 0,
  };
}
