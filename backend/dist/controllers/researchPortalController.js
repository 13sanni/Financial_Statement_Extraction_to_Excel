"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSummary = getSummary;
exports.getUploadQueue = getUploadQueue;
exports.getRuns = getRuns;
exports.getDownloads = getDownloads;
exports.getRunJobs = getRunJobs;
exports.deleteRun = deleteRun;
const researchPortalService_1 = require("../services/researchPortalService");
const researchPortalValidationService_1 = require("../services/researchPortalValidationService");
async function getSummary(_req, res, next) {
    try {
        res.json((0, researchPortalValidationService_1.validatePortalSummary)(await (0, researchPortalService_1.getPortalSummary)()));
    }
    catch (error) {
        next(error);
    }
}
async function getUploadQueue(req, res, next) {
    try {
        const query = (0, researchPortalValidationService_1.validatePortalUploadQueueQuery)(req.query);
        res.json((0, researchPortalValidationService_1.validatePortalUploadQueue)(await (0, researchPortalService_1.getPortalUploadQueue)(query)));
    }
    catch (error) {
        next(error);
    }
}
async function getRuns(req, res, next) {
    try {
        const query = (0, researchPortalValidationService_1.validatePortalRunsQuery)(req.query);
        res.json((0, researchPortalValidationService_1.validatePortalRuns)(await (0, researchPortalService_1.getPortalRuns)(query)));
    }
    catch (error) {
        next(error);
    }
}
async function getDownloads(req, res, next) {
    try {
        const query = (0, researchPortalValidationService_1.validatePortalDownloadsQuery)(req.query);
        res.json((0, researchPortalValidationService_1.validatePortalDownloads)(await (0, researchPortalService_1.getPortalDownloads)(query)));
    }
    catch (error) {
        next(error);
    }
}
async function getRunJobs(req, res, next) {
    try {
        const { runId } = (0, researchPortalValidationService_1.validatePortalRunIdParam)(req.params);
        res.json((0, researchPortalValidationService_1.validatePortalRunJobs)(await (0, researchPortalService_1.getPortalRunJobs)(runId)));
    }
    catch (error) {
        next(error);
    }
}
async function deleteRun(req, res, next) {
    try {
        const { runId } = (0, researchPortalValidationService_1.validatePortalRunIdParam)(req.params);
        res.json((0, researchPortalValidationService_1.validateDeleteRunResponse)(await (0, researchPortalService_1.deletePortalRun)(runId)));
    }
    catch (error) {
        next(error);
    }
}
