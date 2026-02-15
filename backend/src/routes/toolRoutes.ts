import { Router } from "express";
import {
  getDownloads,
  getRunJobs,
  getRuns,
  getSummary,
  getUploadQueue,
} from "../controllers/researchPortalController";
import { runIncomeStatementTool, uploadMetadata } from "../controllers/toolController";
import { upload } from "../middleware/uploadMiddleware";

const router = Router();

router.get("/portal/summary", getSummary);
router.get("/portal/upload-queue", getUploadQueue);
router.get("/portal/runs", getRuns);
router.get("/portal/runs/:runId/jobs", getRunJobs);
router.get("/portal/downloads", getDownloads);

router.post("/upload", upload.array("files", 10), uploadMetadata);
router.post("/tools/income-statement", upload.array("documents", 10), runIncomeStatementTool);

export default router;
