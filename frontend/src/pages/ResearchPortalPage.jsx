import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Panel from "../components/ui/Panel";
import StatusPill from "../components/ui/StatusPill";
import { useToast } from "../components/ui/toastContext";
import { runIncomeStatementExtraction } from "../services/researchApi";
import { getRuns, getSummary, getUploadQueue } from "../services/researchPortalService";

const POLL_INTERVAL_MS = 4000;
const initialPagedData = { items: [], page: 1, pageSize: 5, totalItems: 0, totalPages: 1 };

function ResearchPortalPage() {
  const [summaryCards, setSummaryCards] = useState([]);
  const [uploadQueue, setUploadQueue] = useState(initialPagedData);
  const [recentRuns, setRecentRuns] = useState(initialPagedData);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunSubmitting, setIsRunSubmitting] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [extractionMode, setExtractionMode] = useState("auto");
  const fileInputRef = useRef(null);
  const { addToast } = useToast();
  const queuedCard = summaryCards.find((card) => card.label === "Queued for Extraction");
  const queuedCount = Number.parseInt(queuedCard?.value || "0", 10) || 0;

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [summaryData, queueData, runsData] = await Promise.all([
          getSummary(),
          getUploadQueue({ query: "", sort: "company", page: 1, pageSize: 5 }),
          getRuns({ query: "", status: "all", sort: "recent", page: 1, pageSize: 3 }),
        ]);
        if (!isMounted) return;
        setSummaryCards(summaryData);
        setUploadQueue(queueData);
        setRecentRuns(runsData);
      } catch (error) {
        if (!isMounted) return;
        addToast(error instanceof Error ? error.message : "Failed to load dashboard data.", { type: "error" });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, [addToast, refreshTick]);

  useEffect(() => {
    if (queuedCount <= 0) return;
    const interval = setInterval(() => {
      setRefreshTick((value) => value + 1);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [queuedCount]);

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
    addToast(`${incomingFiles.length} file(s) added to local run batch.`, { type: "success" });
  }

  function clearSelectedFiles() {
    setSelectedFiles([]);
  }

  async function handleStartRun() {
    if (!selectedFiles.length) {
      addToast("Add at least one PDF before starting a run.", { type: "error" });
      return;
    }

    try {
      setIsRunSubmitting(true);
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
      addToast(`Run ${runId || "completed"} in ${effectiveMode} mode.${warningMessage}`, { type: "success" });
      setSelectedFiles([]);
      setRefreshTick((value) => value + 1);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to start extraction run.", { type: "error" });
    } finally {
      setIsRunSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Panel className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white">Quick Start</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-100">Upload and Run Extraction</h2>
          <p className="mt-2 text-sm text-slate-300">
            1. Add PDF files. 2. Choose mode. 3. Start run. 4. Download Excel instantly.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-400">
              Extraction Mode
              <select
                className="mt-1 block rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                value={extractionMode}
                onChange={(event) => setExtractionMode(event.target.value)}
                disabled={isRunSubmitting}
              >
                <option value="auto">Auto</option>
                <option value="gemini">Gemini</option>
                <option value="rule">Rule</option>
              </select>
            </label>
            <Button variant="secondary" onClick={openFilePicker}>
              Add Statement
            </Button>
            <Button
              variant="primary"
              onClick={handleStartRun}
              disabled={isRunSubmitting}
              className={isRunSubmitting ? "cursor-not-allowed opacity-60" : ""}
            >
              {isRunSubmitting ? "Running..." : "Start Run"}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
            onChange={handleFileSelection}
          />
          {selectedFiles.length ? (
            <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950/50 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-300">
                  Local Batch ({selectedFiles.length})
                </p>
                <Button variant="ghost" onClick={clearSelectedFiles}>
                  Clear
                </Button>
              </div>
              <ul className="grid gap-1">
                {selectedFiles.map((file) => (
                  <li key={`${file.name}-${file.size}`} className="text-xs text-slate-200">
                    {file.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-400">Portal Navigation</p>
          <div className="mt-3 grid gap-2">
            <Link to="/runs" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">
              Go to Runs
            </Link>
            <Link to="/exports" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">
              Go to Exports
            </Link>
            <Link to="/maintenance" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">
              Go to Maintenance
            </Link>
          </div>
        </div>
      </Panel>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? <p className="text-sm text-slate-400">Loading summary...</p> : null}
        {summaryCards.map((card) => (
          <Panel key={card.label} as="article">
            <p className="text-xs uppercase tracking-[0.04em] text-slate-400">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-100">{card.value}</p>
            <p className="mt-1 text-sm text-slate-300">{card.delta}</p>
          </Panel>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel as="article">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100">Upload Queue (Preview)</h3>
            <Link to="/runs" className="text-sm font-semibold text-white hover:underline">
              View Runs
            </Link>
          </div>
          <ul className="grid gap-2">
            {uploadQueue.items.map((item) => (
              <li key={`${item.company}-${item.period}`} className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
                <p className="text-sm font-semibold text-slate-100">{item.company}</p>
                <p className="text-xs text-slate-300">
                  {item.period} · {item.pages} pages · {item.uploadedBy}
                </p>
              </li>
            ))}
            {!isLoading && uploadQueue.items.length === 0 ? (
              <li className="rounded-lg border border-dashed border-slate-600 p-3 text-sm text-slate-400">
                Upload queue is currently empty.
              </li>
            ) : null}
          </ul>
        </Panel>

        <Panel as="article">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100">Recent Runs</h3>
            <Link to="/runs" className="text-sm font-semibold text-white hover:underline">
              Open Runs
            </Link>
          </div>
          <ul className="grid gap-2">
            {recentRuns.items.map((run) => (
              <li key={run.id} className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-100">{run.company}</p>
                  <StatusPill status={run.status} />
                </div>
                <p className="mt-1 text-xs text-slate-300">{run.id}</p>
              </li>
            ))}
            {!isLoading && recentRuns.items.length === 0 ? (
              <li className="rounded-lg border border-dashed border-slate-600 p-3 text-sm text-slate-400">
                No recent runs yet.
              </li>
            ) : null}
          </ul>
        </Panel>
      </section>
    </div>
  );
}

export default ResearchPortalPage;
