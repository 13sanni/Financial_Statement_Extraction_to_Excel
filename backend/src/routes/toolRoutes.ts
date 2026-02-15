import { Router } from "express";
import {
  cleanupAllRuns,
  cleanupOldRuns,
  deleteRun,
  getDownloads,
  getRunJobs,
  getRuns,
  getSummary,
  getUploadQueue,
} from "../controllers/researchPortalController";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware";
import { runIncomeStatementTool, uploadMetadata } from "../controllers/toolController";
import { upload } from "../middleware/uploadMiddleware";

const router = Router();

router.use(requireAuth);

router.get("/portal/summary", getSummary);
router.get("/portal/upload-queue", getUploadQueue);
router.get("/portal/runs", getRuns);
router.get("/portal/runs/:runId/jobs", getRunJobs);
router.delete("/portal/runs/:runId", deleteRun);
router.post("/portal/runs/cleanup", requireAdmin, cleanupOldRuns);
router.post("/portal/runs/cleanup-all", requireAdmin, cleanupAllRuns);
router.get("/portal/downloads", getDownloads);

router.post("/upload", upload.array("files", 10), uploadMetadata);
router.post("/tools/income-statement", upload.array("documents", 10), runIncomeStatementTool);

export default router;
