import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../config/env";
import Button from "../components/ui/Button";
import Panel from "../components/ui/Panel";
import StatusPill from "../components/ui/StatusPill";
import { runIncomeStatementExtraction } from "../services/researchApi";
import {
  getDownloads,
  getRuns,
  getSummary,
  getUploadQueue,
} from "../services/researchPortalService";

const PAGE_SIZE = 2;
const initialPagedData = { items: [], page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 1 };

function ResearchPortalPage() {
  const sectionHeadClass = "mb-3 flex items-center justify-between gap-3";
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [uploadSort, setUploadSort] = useState("company");
  const [runStatus, setRunStatus] = useState("all");
  const [downloadSort, setDownloadSort] = useState("recent");
  const [summaryCards, setSummaryCards] = useState([]);
  const [uploadQueue, setUploadQueue] = useState(initialPagedData);
  const [runs, setRuns] = useState(initialPagedData);
  const [downloads, setDownloads] = useState(initialPagedData);
  const [uploadPage, setUploadPage] = useState(1);
  const [runsPage, setRunsPage] = useState(1);
  const [downloadsPage, setDownloadsPage] = useState(1);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isListLoading, setIsListLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isRunSubmitting, setIsRunSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [extractionMode, setExtractionMode] = useState("auto");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setUploadPage(1);
    setRunsPage(1);
    setDownloadsPage(1);
  }, [debouncedQuery, uploadSort, runStatus, downloadSort]);

  useEffect(() => {
    let isMounted = true;
    async function loadSummary() {
      setIsSummaryLoading(true);
      try {
        const summaryData = await getSummary();
        if (!isMounted) return;
        setSummaryCards(summaryData);
      } catch (error) {
        if (!isMounted) return;
        setLoadError(error instanceof Error ? error.message : "Failed to load portal summary");
      } finally {
        if (isMounted) setIsSummaryLoading(false);
      }
    }
    loadSummary();
    return () => {
      isMounted = false;
    };
  }, [refreshTick]);

  useEffect(() => {
    let isMounted = true;
    async function loadLists() {
      setIsListLoading(true);
      setLoadError("");
      try {
        const [uploadData, runsData, downloadsData] = await Promise.all([
          getUploadQueue({
            query: debouncedQuery,
            sort: uploadSort,
            page: uploadPage,
            pageSize: PAGE_SIZE,
          }),
          getRuns({
            query: debouncedQuery,
            status: runStatus,
            page: runsPage,
            pageSize: PAGE_SIZE,
          }),
          getDownloads({
            query: debouncedQuery,
            sort: downloadSort,
            page: downloadsPage,
            pageSize: PAGE_SIZE,
          }),
        ]);

        if (!isMounted) return;
        setUploadQueue(uploadData);
        setRuns(runsData);
        setDownloads(downloadsData);
      } catch (error) {
        if (!isMounted) return;
        setLoadError(error instanceof Error ? error.message : "Failed to load research portal data");
      } finally {
        if (isMounted) setIsListLoading(false);
      }
    }

    loadLists();
    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, downloadSort, downloadsPage, refreshTick, runStatus, runsPage, uploadPage, uploadSort]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileSelection(event) {
    const incomingFiles = Array.from(event.target.files || []);
    if (!incomingFiles.length) return;
    setSelectedFiles((current) => {
      const existing = new Map(current.map((file) => [`${file.name}-${file.size}`, file]));
      incomingFiles.forEach((file) => existing.set(`${file.name}-${file.size}`, file));
      return Array.from(existing.values());
    });
    event.target.value = "";
    setActionMessage(`${incomingFiles.length} file(s) added to local run batch.`);
  }

  function clearSelectedFiles() {
    setSelectedFiles([]);
  }

  async function handleStartRun() {
    if (!selectedFiles.length) {
      setActionMessage("Add at least one PDF before starting a run.");
      return;
    }

    try {
      setIsRunSubmitting(true);
      setActionMessage("");
      const { blob, extractionMode: effectiveMode, warning, runId } = await runIncomeStatementExtraction({
        files: selectedFiles,
        mode: extractionMode,
      });

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "income_statement.xlsx";
      link.click();
      URL.revokeObjectURL(downloadUrl);

      const warningMessage = warning ? ` Warning: ${warning}` : "";
      setActionMessage(`Run ${runId || "completed"} in ${effectiveMode} mode.${warningMessage}`);
      setSelectedFiles([]);
      setRefreshTick((value) => value + 1);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Failed to start extraction run.");
    } finally {
      setIsRunSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Panel className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Research Portal</h2>
          <p className="mt-2 text-sm text-slate-600">
            Monitor uploads, extraction runs, and generated Excel outputs in one workspace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
            Backend API
          </span>
          <code className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm">
            {API_BASE_URL}
          </code>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={handleFileSelection}
        />
      </Panel>

      <Panel className="grid gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:max-w-lg">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.04em] text-slate-500">
              Global Search
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:border-blue-400 focus:ring-4"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search company, period, run ID, or file name..."
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <label className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-500">
              Extraction Mode
              <select
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:border-blue-400 focus:ring-4"
                value={extractionMode}
                onChange={(event) => setExtractionMode(event.target.value)}
                disabled={isRunSubmitting}
              >
                <option value="auto">Auto</option>
                <option value="gemini">Gemini</option>
                <option value="rule">Rule</option>
              </select>
            </label>

            <label className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-500">
              Upload Sort
              <select
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:border-blue-400 focus:ring-4"
                value={uploadSort}
                onChange={(event) => setUploadSort(event.target.value)}
              >
                <option value="company">Company (A-Z)</option>
                <option value="pages-desc">Pages (High to Low)</option>
                <option value="pages-asc">Pages (Low to High)</option>
              </select>
            </label>

            <label className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-500">
              Run Status
              <select
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:border-blue-400 focus:ring-4"
                value={runStatus}
                onChange={(event) => setRunStatus(event.target.value)}
              >
                <option value="all">All</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="review">Needs Review</option>
              </select>
            </label>

            <label className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-500">
              Export Sort
              <select
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:border-blue-400 focus:ring-4"
                value={downloadSort}
                onChange={(event) => setDownloadSort(event.target.value)}
              >
                <option value="recent">Recent First</option>
                <option value="size-desc">Largest First</option>
                <option value="size-asc">Smallest First</option>
              </select>
            </label>
          </div>
        </div>
        {selectedFiles.length ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-600">
                Local Batch ({selectedFiles.length})
              </p>
              <Button variant="ghost" onClick={clearSelectedFiles}>
                Clear
              </Button>
            </div>
            <ul className="grid gap-1">
              {selectedFiles.map((file) => (
                <li key={`${file.name}-${file.size}`} className="text-xs text-slate-700">
                  {file.name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {isListLoading ? <p className="text-sm text-slate-500">Refreshing list data...</p> : null}
        {loadError ? <p className="text-sm font-medium text-red-600">{loadError}</p> : null}
        {actionMessage ? <p className="text-sm font-medium text-blue-700">{actionMessage}</p> : null}
      </Panel>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isSummaryLoading ? (
          <p className="text-sm text-slate-500">Loading summary...</p>
        ) : null}
        {summaryCards.map((card) => (
          <Panel key={card.label} as="article">
            <p className="text-xs uppercase tracking-[0.04em] text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-1 text-sm text-slate-600">{card.delta}</p>
          </Panel>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel as="article">
          <div className={sectionHeadClass}>
            <h3 className="text-base font-semibold text-slate-900">Upload Queue</h3>
            <Button variant="secondary" onClick={openFilePicker}>
              Add Statement
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 px-1.5 py-2 text-left text-xs font-semibold text-slate-500">
                    Company
                  </th>
                  <th className="border-b border-slate-200 px-1.5 py-2 text-left text-xs font-semibold text-slate-500">
                    Period
                  </th>
                  <th className="border-b border-slate-200 px-1.5 py-2 text-left text-xs font-semibold text-slate-500">
                    Pages
                  </th>
                  <th className="border-b border-slate-200 px-1.5 py-2 text-left text-xs font-semibold text-slate-500">
                    Uploaded By
                  </th>
                </tr>
              </thead>
              <tbody>
                {uploadQueue.items.map((item) => (
                  <tr key={`${item.company}-${item.period}`}>
                    <td className="whitespace-nowrap border-b border-slate-100 px-1.5 py-2 text-sm text-slate-900">
                      {item.company}
                    </td>
                    <td className="whitespace-nowrap border-b border-slate-100 px-1.5 py-2 text-sm text-slate-900">
                      {item.period}
                    </td>
                    <td className="whitespace-nowrap border-b border-slate-100 px-1.5 py-2 text-sm text-slate-900">
                      {item.pages}
                    </td>
                    <td className="whitespace-nowrap border-b border-slate-100 px-1.5 py-2 text-sm text-slate-900">
                      {item.uploadedBy}
                    </td>
                  </tr>
                ))}
                {!isListLoading && uploadQueue.items.length === 0 ? (
                  <tr>
                    <td className="px-1.5 py-3 text-sm text-slate-500" colSpan={4}>
                      No upload rows match your current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page {uploadQueue.page} of {uploadQueue.totalPages} ({uploadQueue.totalItems} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setUploadPage((current) => Math.max(1, current - 1))}
                disabled={uploadQueue.page <= 1 || isListLoading}
                className={uploadQueue.page <= 1 || isListLoading ? "cursor-not-allowed opacity-50" : ""}
              >
                Prev
              </Button>
              <Button
                variant="ghost"
                onClick={() => setUploadPage((current) => Math.min(uploadQueue.totalPages, current + 1))}
                disabled={uploadQueue.page >= uploadQueue.totalPages || isListLoading}
                className={
                  uploadQueue.page >= uploadQueue.totalPages || isListLoading
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }
              >
                Next
              </Button>
            </div>
          </div>
        </Panel>

        <Panel as="article">
          <div className={sectionHeadClass}>
            <h3 className="text-base font-semibold text-slate-900">Extraction Runs</h3>
            <Button
              variant="primary"
              onClick={handleStartRun}
              disabled={isRunSubmitting}
              className={isRunSubmitting ? "cursor-not-allowed opacity-60" : ""}
            >
              {isRunSubmitting ? "Running..." : "Start Run"}
            </Button>
          </div>
          <ul className="grid gap-3">
            {runs.items.map((run) => (
              <li
                key={run.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{run.company}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {run.id} · Started {run.started}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <StatusPill status={run.status} />
                  <p className="mt-1 text-xs text-slate-600">Confidence {run.confidence}</p>
                </div>
              </li>
            ))}
            {!isListLoading && runs.items.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                No extraction runs match your current filters.
              </li>
            ) : null}
          </ul>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page {runs.page} of {runs.totalPages} ({runs.totalItems} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setRunsPage((current) => Math.max(1, current - 1))}
                disabled={runs.page <= 1 || isListLoading}
                className={runs.page <= 1 || isListLoading ? "cursor-not-allowed opacity-50" : ""}
              >
                Prev
              </Button>
              <Button
                variant="ghost"
                onClick={() => setRunsPage((current) => Math.min(runs.totalPages, current + 1))}
                disabled={runs.page >= runs.totalPages || isListLoading}
                className={
                  runs.page >= runs.totalPages || isListLoading ? "cursor-not-allowed opacity-50" : ""
                }
              >
                Next
              </Button>
            </div>
          </div>
        </Panel>

        <Panel as="article" className="lg:col-span-2">
          <div className={sectionHeadClass}>
            <h3 className="text-base font-semibold text-slate-900">Latest Excel Exports</h3>
            <Button variant="secondary" onClick={() => setDownloadsPage(1)}>
              View All
            </Button>
          </div>
          <ul className="grid gap-3">
            {downloads.items.map((download) => (
              <li
                key={download.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{download.file}</p>
                  <p className="mt-1 text-xs text-slate-600">Generated {download.generatedAt}</p>
                </div>
                <div className="flex items-center gap-3 text-left sm:text-right">
                  <span className="text-sm text-slate-700">{download.size}</span>
                  <Button
                    variant="ghost"
                    onClick={() => window.open(download.downloadUrl, "_blank", "noopener,noreferrer")}
                  >
                    Download
                  </Button>
                </div>
              </li>
            ))}
            {!isListLoading && downloads.items.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                No exports match your current filters.
              </li>
            ) : null}
          </ul>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page {downloads.page} of {downloads.totalPages} ({downloads.totalItems} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setDownloadsPage((current) => Math.max(1, current - 1))}
                disabled={downloads.page <= 1 || isListLoading}
                className={downloads.page <= 1 || isListLoading ? "cursor-not-allowed opacity-50" : ""}
              >
                Prev
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  setDownloadsPage((current) => Math.min(downloads.totalPages, current + 1))
                }
                disabled={downloads.page >= downloads.totalPages || isListLoading}
                className={
                  downloads.page >= downloads.totalPages || isListLoading
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }
              >
                Next
              </Button>
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}

export default ResearchPortalPage;
