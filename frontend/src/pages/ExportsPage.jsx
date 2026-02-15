import { useEffect, useState } from "react";
import Button from "../components/ui/Button";
import Panel from "../components/ui/Panel";
import { useToast } from "../components/ui/toastContext";
import { getDownloads } from "../services/researchPortalService";

const initialPagedData = { items: [], page: 1, pageSize: 5, totalItems: 0, totalPages: 1 };

function ExportsPage() {
  const [query, setQuery] = useState("");
  const [downloadSort, setDownloadSort] = useState("recent");
  const [downloadsPage, setDownloadsPage] = useState(1);
  const [downloadsPageSize, setDownloadsPageSize] = useState(5);
  const [downloads, setDownloads] = useState(initialPagedData);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    async function loadExports() {
      setIsLoading(true);
      try {
        const data = await getDownloads({
          query: query.trim(),
          sort: downloadSort,
          page: downloadsPage,
          pageSize: downloadsPageSize,
        });
        if (!isMounted) return;
        setDownloads(data);
      } catch (error) {
        if (!isMounted) return;
        addToast(error instanceof Error ? error.message : "Failed to load exports.", { type: "error" });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadExports();
    return () => {
      isMounted = false;
    };
  }, [addToast, query, downloadSort, downloadsPage, downloadsPageSize]);

  return (
    <div className="grid gap-4">
      <Panel className="grid gap-3">
        <h2 className="text-xl font-semibold text-slate-100">Excel Exports</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            type="search"
            value={query}
            onChange={(event) => {
              setDownloadsPage(1);
              setQuery(event.target.value);
            }}
            placeholder="Search export file..."
          />
          <select
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            value={downloadSort}
            onChange={(event) => {
              setDownloadsPage(1);
              setDownloadSort(event.target.value);
            }}
          >
            <option value="recent">Recent</option>
            <option value="size-desc">Largest First</option>
            <option value="size-asc">Smallest First</option>
          </select>
          <select
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            value={downloadsPageSize}
            onChange={(event) => {
              setDownloadsPage(1);
              setDownloadsPageSize(Number(event.target.value));
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
          {downloads.items.map((download) => (
            <li
              key={download.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-950/30 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-100">{download.file}</p>
                <p className="mt-1 text-xs text-slate-300">Generated {download.generatedAt}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-200">{download.size}</span>
                <Button
                  variant="ghost"
                  onClick={() => window.open(download.downloadUrl, "_blank", "noopener,noreferrer")}
                >
                  Download
                </Button>
              </div>
            </li>
          ))}
          {!isLoading && downloads.items.length === 0 ? (
            <li className="rounded-xl border border-dashed border-slate-600 p-3 text-sm text-slate-400">
              No exports found.
            </li>
          ) : null}
        </ul>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Page {downloads.page} of {downloads.totalPages} ({downloads.totalItems} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setDownloadsPage((current) => Math.max(1, current - 1))}
              disabled={downloads.page <= 1 || isLoading}
              className={downloads.page <= 1 || isLoading ? "cursor-not-allowed opacity-50" : ""}
            >
              Prev
            </Button>
            <Button
              variant="ghost"
              onClick={() => setDownloadsPage((current) => Math.min(downloads.totalPages, current + 1))}
              disabled={downloads.page >= downloads.totalPages || isLoading}
              className={downloads.page >= downloads.totalPages || isLoading ? "cursor-not-allowed opacity-50" : ""}
            >
              Next
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export default ExportsPage;
