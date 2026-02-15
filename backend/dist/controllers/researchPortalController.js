"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSummary = getSummary;
exports.getUploadQueue = getUploadQueue;
exports.getRuns = getRuns;
exports.getDownloads = getDownloads;
const researchPortalService_1 = require("../services/researchPortalService");
const researchPortalValidationService_1 = require("../services/researchPortalValidationService");
function getSummary(_req, res) {
    res.json((0, researchPortalValidationService_1.validatePortalSummary)((0, researchPortalService_1.getPortalSummary)()));
}
function getUploadQueue(req, res) {
    const query = (0, researchPortalValidationService_1.validatePortalUploadQueueQuery)(req.query);
    res.json((0, researchPortalValidationService_1.validatePortalUploadQueue)((0, researchPortalService_1.getPortalUploadQueue)(query)));
}
function getRuns(req, res) {
    const query = (0, researchPortalValidationService_1.validatePortalRunsQuery)(req.query);
    res.json((0, researchPortalValidationService_1.validatePortalRuns)((0, researchPortalService_1.getPortalRuns)(query)));
}
function getDownloads(req, res) {
    const query = (0, researchPortalValidationService_1.validatePortalDownloadsQuery)(req.query);
    res.json((0, researchPortalValidationService_1.validatePortalDownloads)((0, researchPortalService_1.getPortalDownloads)(query)));
}
