import { useState } from "react";
import Button from "../components/ui/Button";
import Panel from "../components/ui/Panel";
import { useToast } from "../components/ui/toastContext";
import { cleanupAllRuns, cleanupOldRuns } from "../services/researchPortalService";

function MaintenancePage() {
  const [cleanupDays, setCleanupDays] = useState(30);
  const [isCleanupSubmitting, setIsCleanupSubmitting] = useState(false);
  const [isDeleteAllSubmitting, setIsDeleteAllSubmitting] = useState(false);
  const { addToast } = useToast();

  async function handleCleanupOldRuns() {
    const confirmed = window.confirm(`Delete runs older than ${cleanupDays} days?`);
    if (!confirmed) return;
    try {
      setIsCleanupSubmitting(true);
      const result = await cleanupOldRuns({ olderThanDays: cleanupDays });
      addToast(
        `Cleanup complete: ${result.deletedRuns} runs and ${result.deletedJobs} jobs deleted (older than ${result.olderThanDays} days).`,
        { type: "success" },
      );
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to cleanup older files.", { type: "error" });
    } finally {
      setIsCleanupSubmitting(false);
    }
  }

  async function handleDeleteAllHistory() {
    const confirmed = window.confirm("Delete ALL run history and job history?");
    if (!confirmed) return;
    try {
      setIsDeleteAllSubmitting(true);
      const result = await cleanupAllRuns();
      addToast(`All history cleanup complete: ${result.deletedRuns} runs and ${result.deletedJobs} jobs deleted.`, {
        type: "success",
      });
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to delete all history.", { type: "error" });
    } finally {
      setIsDeleteAllSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Panel>
        <h2 className="text-xl font-semibold text-slate-100">Maintenance</h2>
        <p className="mt-1 text-sm text-slate-300">
          Manage history cleanup for old records and keep the portal lightweight.
        </p>
      </Panel>

      <Panel className="grid gap-3">
        <h3 className="text-base font-semibold text-slate-100">Delete Older Files</h3>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-400">
            Older Than
            <select
              className="ml-2 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              value={cleanupDays}
              onChange={(event) => setCleanupDays(Number(event.target.value))}
              disabled={isCleanupSubmitting}
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
            </select>
          </label>
          <Button
            variant="ghost"
            onClick={handleCleanupOldRuns}
            disabled={isCleanupSubmitting}
            className={isCleanupSubmitting ? "cursor-not-allowed opacity-50" : ""}
          >
            {isCleanupSubmitting ? "Deleting..." : "Delete Older Files"}
          </Button>
        </div>
      </Panel>

      <Panel className="grid gap-3">
        <h3 className="text-base font-semibold text-slate-100">Delete Full History</h3>
        <p className="text-sm text-slate-300">This removes all run and job records from active history.</p>
        <div>
          <Button
            variant="ghost"
            className="text-white"
            onClick={handleDeleteAllHistory}
            disabled={isDeleteAllSubmitting}
          >
            {isDeleteAllSubmitting ? "Deleting All..." : "Delete All History"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}

export default MaintenancePage;
