import { useEffect, useState } from "react";
import Button from "../components/ui/Button";
import Panel from "../components/ui/Panel";
import StatusPill from "../components/ui/StatusPill";
import { useToast } from "../components/ui/toastContext";
import { deleteRun, getRunJobs, getRuns } from "../services/researchPortalService";

const initialPagedData = { items: [], page: 1, pageSize: 5, totalItems: 0, totalPages: 1 };

function RunsPage() {
  const [query, setQuery] = useState("");
  const [runStatus, setRunStatus] = useState("all");
  const [runSort, setRunSort] = useState("recent");
  const [runsPage, setRunsPage] = useState(1);
  const [runsPageSize, setRunsPageSize] = useState(5);
  const [runs, setRuns] = useState(initialPagedData);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRunId, setExpandedRunId] = useState("");
  const [runJobsById, setRunJobsById] = useState({});
  const [runJobsLoadingId, setRunJobsLoadingId] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    async function loadRunsData() {
      setIsLoading(true);
      try {
        const runsData = await getRuns({
          query: query.trim(),
          status: runStatus,
          sort: runSort,
          page: runsPage,
          pageSize: runsPageSize,
        });
        if (!isMounted) return;
        setRuns(runsData);
      } catch (error) {
        if (!isMounted) return;
        addToast(error instanceof Error ? error.message : "Failed to load runs.", { type: "error" });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadRunsData();
    return () => {
      isMounted = false;
    };
  }, [addToast, query, runStatus, runSort, runsPage, runsPageSize]);

  async function toggleRunDetails(runId) {
    if (expandedRunId === runId) {
      setExpandedRunId("");
      return;
    }
    setExpandedRunId(runId);
    if (runJobsById[runId]) return;
    try {
      setRunJobsLoadingId(runId);
      const runJobs = await getRunJobs(runId);
      setRunJobsById((current) => ({ ...current, [runId]: runJobs }));
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to load run details.", { type: "error" });
    } finally {
      setRunJobsLoadingId("");
    }
  }

  async function handleDeleteRun(runId) {
    const confirmed = window.confirm(`Delete run ${runId} and related records?`);
    if (!confirmed) return;

    try {
      const result = await deleteRun(runId);
      addToast(result.deleted ? `Run ${runId} deleted.` : `Run ${runId} was not found.`, {
        type: result.deleted ? "success" : "error",
      });
      setExpandedRunId("");
      setRunJobsById((current) => {
        const next = { ...current };
        delete next[runId];
        return next;
      });
      setRunsPage(1);
      const refreshed = await getRuns({
        query: query.trim(),
        status: runStatus,
        sort: runSort,
        page: 1,
        pageSize: runsPageSize,
      });
      setRuns(refreshed);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to delete run.", { type: "error" });
    }
  }

  return (
    <div className="grid gap-4">
      <Panel className="grid gap-3">
        <h2 className="text-xl font-semibold text-slate-100">Extraction Runs</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            type="search"
            value={query}
            onChange={(event) => {
              setRunsPage(1);
              setQuery(event.target.value);
            }}
            placeholder="Search company or run ID..."
          />
          <select
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            value={runStatus}
            onChange={(event) => {
              setRunsPage(1);
              setRunStatus(event.target.value);
            }}
          >
            <option value="all">All Status</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="review">Needs Review</option>
          </select>
          <select
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            value={runSort}
            onChange={(event) => {
              setRunsPage(1);
              setRunSort(event.target.value);
            }}
          >
            <option value="recent">Recent</option>
            <option value="progress-desc">Highest Progress</option>
            <option value="progress-asc">Lowest Progress</option>
          </select>
          <select
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            value={runsPageSize}
            onChange={(event) => {
              setRunsPage(1);
              setRunsPageSize(Number(event.target.value));
            }}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
          </select>
        </div>
      </Panel>

      <Panel as="article">
        <ul className="grid gap-3">
          {runs.items.map((run) => (
            <li key={run.id} className="rounded-xl border border-slate-700 bg-slate-950/30 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-100">{run.company}</p>
                  <p className="mt-1 text-xs text-slate-300">{run.id} · Started {run.started}</p>
                  <p className="mt-1 text-xs text-slate-300">
                    Q:{run.queuedCount} P:{run.processingCount} C:{run.completedCount} F:{run.failedCount}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <StatusPill status={run.status} />
                  <p className="mt-1 text-xs text-slate-300">Confidence {run.confidence}</p>
                  <div className="mt-2 w-full sm:w-44">
                    <div className="h-1.5 w-full rounded-full bg-slate-700">
                      <div
                        className={`h-1.5 rounded-full ${
                          run.status === "review" ? "bg-slate-500" : run.status === "completed" ? "bg-white" : "bg-slate-300"
                        }`}
                        style={{ width: `${run.progressPercent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">{run.progressPercent}% complete</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
                    <Button variant="ghost" onClick={() => toggleRunDetails(run.id)}>
                      {expandedRunId === run.id ? "Hide Details" : "View Details"}
                    </Button>
                    {run.outputExcelUrl ? (
                      <Button variant="ghost" onClick={() => window.open(run.outputExcelUrl, "_blank", "noopener,noreferrer")}>
                        Open Output
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
              {expandedRunId === run.id ? (
                <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                  {run.warning ? <p className="text-xs text-white"><span className="font-semibold">Warning:</span> {run.warning}</p> : null}
                  {run.failureReason ? <p className="mt-2 text-xs text-white"><span className="font-semibold">Failure:</span> {run.failureReason}</p> : null}
                  {runJobsLoadingId === run.id ? <p className="mt-3 text-xs text-slate-400">Loading job details...</p> : null}
                  {runJobsById[run.id]?.length ? (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="border-b border-slate-700 px-1.5 py-1.5 text-left text-[11px] text-slate-400">File</th>
                            <th className="border-b border-slate-700 px-1.5 py-1.5 text-left text-[11px] text-slate-400">Status</th>
                            <th className="border-b border-slate-700 px-1.5 py-1.5 text-left text-[11px] text-slate-400">Updated</th>
                            <th className="border-b border-slate-700 px-1.5 py-1.5 text-left text-[11px] text-slate-400">Excel</th>
                          </tr>
                        </thead>
                        <tbody>
                          {runJobsById[run.id].map((job) => (
                            <tr key={job.jobId}>
                              <td className="border-b border-slate-800 px-1.5 py-1.5 text-xs text-slate-200">{job.fileName}</td>
                              <td className="border-b border-slate-800 px-1.5 py-1.5 text-xs text-slate-200">{job.status}</td>
                              <td className="border-b border-slate-800 px-1.5 py-1.5 text-xs text-slate-200">{job.updatedAt}</td>
                              <td className="border-b border-slate-800 px-1.5 py-1.5 text-xs text-slate-200">
                                {job.outputExcelUrl ? (
                                  <button
                                    type="button"
                                    className="text-white underline"
                                    onClick={() => window.open(job.outputExcelUrl, "_blank", "noopener,noreferrer")}
                                  >
                                    Excel
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                  <div className="mt-3 flex justify-end">
                    <Button variant="ghost" className="text-white" onClick={() => handleDeleteRun(run.id)}>
                      Delete Run
                    </Button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
          {!isLoading && runs.items.length === 0 ? (
            <li className="rounded-xl border border-dashed border-slate-600 p-3 text-sm text-slate-400">
              No runs match your current filters.
            </li>
          ) : null}
        </ul>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Page {runs.page} of {runs.totalPages} ({runs.totalItems} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setRunsPage((current) => Math.max(1, current - 1))}
              disabled={runs.page <= 1 || isLoading}
              className={runs.page <= 1 || isLoading ? "cursor-not-allowed opacity-50" : ""}
            >
              Prev
            </Button>
            <Button
              variant="ghost"
              onClick={() => setRunsPage((current) => Math.min(runs.totalPages, current + 1))}
              disabled={runs.page >= runs.totalPages || isLoading}
              className={runs.page >= runs.totalPages || isLoading ? "cursor-not-allowed opacity-50" : ""}
            >
              Next
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export default RunsPage;
