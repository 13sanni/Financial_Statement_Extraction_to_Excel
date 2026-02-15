import { NextFunction, Request, Response } from "express";
import {
  getPortalDownloads,
  getPortalRunJobs,
  getPortalRuns,
  getPortalSummary,
  getPortalUploadQueue,
} from "../services/researchPortalService";
import {
  validatePortalDownloads,
  validatePortalDownloadsQuery,
  validatePortalRunIdParam,
  validatePortalRunJobs,
  validatePortalRuns,
  validatePortalRunsQuery,
  validatePortalSummary,
  validatePortalUploadQueue,
  validatePortalUploadQueueQuery,
} from "../services/researchPortalValidationService";

export async function getSummary(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(validatePortalSummary(await getPortalSummary()));
  } catch (error) {
    next(error);
  }
}

export async function getUploadQueue(req: Request, res: Response, next: NextFunction) {
  try {
    const query = validatePortalUploadQueueQuery(req.query);
    res.json(validatePortalUploadQueue(await getPortalUploadQueue(query)));
  } catch (error) {
    next(error);
  }
}

export async function getRuns(req: Request, res: Response, next: NextFunction) {
  try {
    const query = validatePortalRunsQuery(req.query);
    res.json(validatePortalRuns(await getPortalRuns(query)));
  } catch (error) {
    next(error);
  }
}

export async function getDownloads(req: Request, res: Response, next: NextFunction) {
  try {
    const query = validatePortalDownloadsQuery(req.query);
    res.json(validatePortalDownloads(await getPortalDownloads(query)));
  } catch (error) {
    next(error);
  }
}

export async function getRunJobs(req: Request, res: Response, next: NextFunction) {
  try {
    const { runId } = validatePortalRunIdParam(req.params);
    res.json(validatePortalRunJobs(await getPortalRunJobs(runId)));
  } catch (error) {
    next(error);
  }
}
