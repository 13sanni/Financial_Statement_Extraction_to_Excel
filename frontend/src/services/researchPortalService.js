import axios from "axios";
import { API_BASE_URL } from "../config/env";
import {
  downloadsResponseSchema,
  runsResponseSchema,
  summaryResponseSchema,
  uploadQueueResponseSchema,
} from "./researchPortalSchemas";

const portalApi = axios.create({
  baseURL: API_BASE_URL,
});

function parseOrThrow(schema, data, label) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? "unknown validation error";
    throw new Error(`Invalid API response for ${label}: ${issue}`);
  }
  return parsed.data;
}

export async function getSummary() {
  const response = await portalApi.get("/portal/summary");
  return parseOrThrow(summaryResponseSchema, response.data, "summary");
}

export async function getUploadQueue() {
  const response = await portalApi.get("/portal/upload-queue");
  return parseOrThrow(uploadQueueResponseSchema, response.data, "upload queue");
}

export async function getRuns() {
  const response = await portalApi.get("/portal/runs");
  return parseOrThrow(runsResponseSchema, response.data, "runs");
}

export async function getDownloads() {
  const response = await portalApi.get("/portal/downloads");
  return parseOrThrow(downloadsResponseSchema, response.data, "downloads");
}
