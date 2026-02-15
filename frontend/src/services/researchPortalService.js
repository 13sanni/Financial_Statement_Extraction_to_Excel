import axios from "axios";
import { API_BASE_URL } from "../config/env";
import {
  deleteRunResponseSchema,
  downloadsResponseSchema,
  runJobsResponseSchema,
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

export async function getUploadQueue({ query, sort, page, pageSize }) {
  const response = await portalApi.get("/portal/upload-queue", {
    params: { query, sort, page, pageSize },
  });
  return parseOrThrow(uploadQueueResponseSchema, response.data, "upload queue");
}

export async function getRuns({ query, status, sort, page, pageSize }) {
  const response = await portalApi.get("/portal/runs", {
    params: { query, status, sort, page, pageSize },
  });
  return parseOrThrow(runsResponseSchema, response.data, "runs");
}

export async function getDownloads({ query, sort, page, pageSize }) {
  const response = await portalApi.get("/portal/downloads", {
    params: { query, sort, page, pageSize },
  });
  return parseOrThrow(downloadsResponseSchema, response.data, "downloads");
}

export async function getRunJobs(runId) {
  const response = await portalApi.get(`/portal/runs/${encodeURIComponent(runId)}/jobs`);
  return parseOrThrow(runJobsResponseSchema, response.data, "run jobs");
}

export async function deleteRun(runId) {
  const response = await portalApi.delete(`/portal/runs/${encodeURIComponent(runId)}`);
  return parseOrThrow(deleteRunResponseSchema, response.data, "delete run");
}
