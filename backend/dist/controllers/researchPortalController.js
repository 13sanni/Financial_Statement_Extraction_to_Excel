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
function getUploadQueue(_req, res) {
    res.json((0, researchPortalValidationService_1.validatePortalUploadQueue)((0, researchPortalService_1.getPortalUploadQueue)()));
}
function getRuns(_req, res) {
    res.json((0, researchPortalValidationService_1.validatePortalRuns)((0, researchPortalService_1.getPortalRuns)()));
}
function getDownloads(_req, res) {
    res.json((0, researchPortalValidationService_1.validatePortalDownloads)((0, researchPortalService_1.getPortalDownloads)()));
}
