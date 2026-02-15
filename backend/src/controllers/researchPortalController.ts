import { Request, Response } from "express";
import {
  getPortalDownloads,
  getPortalRuns,
  getPortalSummary,
  getPortalUploadQueue,
} from "../services/researchPortalService";

export function getSummary(_req: Request, res: Response) {
  res.json(getPortalSummary());
}

export function getUploadQueue(_req: Request, res: Response) {
  res.json(getPortalUploadQueue());
}

export function getRuns(_req: Request, res: Response) {
  res.json(getPortalRuns());
}

export function getDownloads(_req: Request, res: Response) {
  res.json(getPortalDownloads());
}
