import { Router } from "express";
import { runIncomeStatementTool, uploadMetadata } from "../controllers/toolController";
import { upload } from "../middleware/uploadMiddleware";

const router = Router();

router.post("/upload", upload.array("files", 10), uploadMetadata);
router.post("/tools/income-statement", upload.array("documents", 10), runIncomeStatementTool);

export default router;
