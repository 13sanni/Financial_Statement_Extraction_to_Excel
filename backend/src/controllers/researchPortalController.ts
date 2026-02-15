import { Request, Response } from "express";
import {
  getPortalDownloads,
  getPortalRuns,
  getPortalSummary,
  getPortalUploadQueue,
} from "../services/researchPortalService";
import {
  validatePortalDownloads,
  validatePortalDownloadsQuery,
  validatePortalRuns,
  validatePortalRunsQuery,
  validatePortalSummary,
  validatePortalUploadQueue,
  validatePortalUploadQueueQuery,
} from "../services/researchPortalValidationService";

export function getSummary(_req: Request, res: Response) {
  res.json(validatePortalSummary(getPortalSummary()));
}

export function getUploadQueue(req: Request, res: Response) {
  const query = validatePortalUploadQueueQuery(req.query);
  res.json(validatePortalUploadQueue(getPortalUploadQueue(query)));
}

export function getRuns(req: Request, res: Response) {
  const query = validatePortalRunsQuery(req.query);
  res.json(validatePortalRuns(getPortalRuns(query)));
}

export function getDownloads(req: Request, res: Response) {
  const query = validatePortalDownloadsQuery(req.query);
  res.json(validatePortalDownloads(getPortalDownloads(query)));
}
