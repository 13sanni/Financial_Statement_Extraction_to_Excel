import { Request, Response } from "express";
import {
  getPortalDownloads,
  getPortalRuns,
  getPortalSummary,
  getPortalUploadQueue,
} from "../services/researchPortalService";
import {
  validatePortalDownloads,
  validatePortalRuns,
  validatePortalSummary,
  validatePortalUploadQueue,
} from "../services/researchPortalValidationService";

export function getSummary(_req: Request, res: Response) {
  res.json(validatePortalSummary(getPortalSummary()));
}

export function getUploadQueue(_req: Request, res: Response) {
  res.json(validatePortalUploadQueue(getPortalUploadQueue()));
}

export function getRuns(_req: Request, res: Response) {
  res.json(validatePortalRuns(getPortalRuns()));
}

export function getDownloads(_req: Request, res: Response) {
  res.json(validatePortalDownloads(getPortalDownloads()));
}
