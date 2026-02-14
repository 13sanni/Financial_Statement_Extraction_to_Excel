"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const toolController_1 = require("../controllers/toolController");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const router = (0, express_1.Router)();
router.post("/upload", uploadMiddleware_1.upload.array("files", 10), toolController_1.uploadMetadata);
router.post("/tools/income-statement", uploadMiddleware_1.upload.array("documents", 10), toolController_1.runIncomeStatementTool);
exports.default = router;
