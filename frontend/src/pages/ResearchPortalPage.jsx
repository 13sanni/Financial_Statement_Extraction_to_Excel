import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config/env";
import Button from "../components/ui/Button";
import Panel from "../components/ui/Panel";
import StatusPill from "../components/ui/StatusPill";
import {
  getDownloads,
  getRuns,
  getSummary,
  getUploadQueue,
} from "../services/researchPortalService";

function parseSizeToKb(size) {
  const [value, unit] = size.split(" ");
  const numeric = Number.parseFloat(value);
  if (unit === "MB") return Math.round(numeric * 1024);
  return Math.round(numeric);
}

function ResearchPortalPage() {
  const sectionHeadClass = "mb-3 flex items-center justify-between gap-3";
  const [query, setQuery] = useState("");
  const [uploadSort, setUploadSort] = useState("company");
  const [runStatus, setRunStatus] = useState("all");
  const [downloadSort, setDownloadSort] = useState("recent");
  const [summaryCards, setSummaryCards] = useState([]);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [runs, setRuns] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPortalData() {
      setIsLoading(true);
      setLoadError("");

      try {
        const [summaryData, uploadData, runsData, downloadsData] = await Promise.all([
          getSummary(),
          getUploadQueue(),
          getRuns(),
          getDownloads(),
        ]);

        if (!isMounted) return;
        setSummaryCards(summaryData);
        setUploadQueue(uploadData);
        setRuns(runsData);
        setDownloads(downloadsData);
      } catch (error) {
        if (!isMounted) return;
        setLoadError(error instanceof Error ? error.message : "Failed to load research portal data");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPortalData();
    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredUploadQueue = useMemo(() => {
    const filtered = uploadQueue.filter((item) => {
      if (!normalizedQuery) return true;
      const searchable = `${item.company} ${item.period} ${item.uploadedBy}`.toLowerCase();
      return searchable.includes(normalizedQuery);
    });

    return filtered.sort((a, b) => {
      if (uploadSort === "pages-desc") return b.pages - a.pages;
      if (uploadSort === "pages-asc") return a.pages - b.pages;
      return a.company.localeCompare(b.company);
    });
  }, [normalizedQuery, uploadSort]);

  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      const matchesQuery =
        !normalizedQuery ||
        `${run.company} ${run.id} ${run.started}`.toLowerCase().includes(normalizedQuery);
      const matchesStatus = runStatus === "all" || run.status === runStatus;
      return matchesQuery && matchesStatus;
    });
  }, [normalizedQuery, runStatus]);

  const filteredDownloads = useMemo(() => {
    const filtered = downloads.filter((download) => {
      if (!normalizedQuery) return true;
      return download.file.toLowerCase().includes(normalizedQuery);
    });

    return filtered.sort((a, b) => {
      if (downloadSort === "size-desc") return parseSizeToKb(b.size) - parseSizeToKb(a.size);
      if (downloadSort === "size-asc") return parseSizeToKb(a.size) - parseSizeToKb(b.size);
      return b.generatedAt.localeCompare(a.generatedAt);
    });
  }, [downloadSort, normalizedQuery]);

  function handleAction(actionLabel) {
    console.info(`[ResearchPortalPage] ${actionLabel}`);
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
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-500">
              Upload Sort
              <select
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:border-blue-400 focus:ring-4"
                value={uploadSort}
                onChange={(event) => setUploadSort(event.target.value)}
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
              >
                <option value="recent">Recent First</option>
                <option value="size-desc">Largest First</option>
                <option value="size-asc">Smallest First</option>
              </select>
            </label>
          </div>
        </div>
        {isLoading ? <p className="text-sm text-slate-500">Loading portal data...</p> : null}
        {loadError ? <p className="text-sm font-medium text-red-600">{loadError}</p> : null}
      </Panel>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            <Button variant="secondary" onClick={() => handleAction("Add Statement clicked")}>
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
                {filteredUploadQueue.map((item) => (
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
                {filteredUploadQueue.length === 0 ? (
                  <tr>
                    <td className="px-1.5 py-3 text-sm text-slate-500" colSpan={4}>
                      No upload rows match your current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel as="article">
          <div className={sectionHeadClass}>
            <h3 className="text-base font-semibold text-slate-900">Extraction Runs</h3>
            <Button variant="primary" onClick={() => handleAction("Start Run clicked")}>
              Start Run
            </Button>
          </div>
          <ul className="grid gap-3">
            {filteredRuns.map((run) => (
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
            {filteredRuns.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                No extraction runs match your current filters.
              </li>
            ) : null}
          </ul>
        </Panel>

        <Panel as="article" className="lg:col-span-2">
          <div className={sectionHeadClass}>
            <h3 className="text-base font-semibold text-slate-900">Latest Excel Exports</h3>
            <Button variant="secondary" onClick={() => handleAction("View All exports clicked")}>
              View All
            </Button>
          </div>
          <ul className="grid gap-3">
            {filteredDownloads.map((download) => (
              <li
                key={download.file}
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
                    onClick={() => handleAction(`Download clicked: ${download.file}`)}
                  >
                    Download
                  </Button>
                </div>
              </li>
            ))}
            {filteredDownloads.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                No exports match your current filters.
              </li>
            ) : null}
          </ul>
        </Panel>
      </section>
    </div>
  );
}

export default ResearchPortalPage;
