import axios from "axios";
import { API_BASE_URL } from "../config/env";

const portalApi = axios.create({
  baseURL: API_BASE_URL,
});

export async function getSummary() {
  const response = await portalApi.get("/portal/summary");
  return response.data;
}

export async function getUploadQueue() {
  const response = await portalApi.get("/portal/upload-queue");
  return response.data;
}

export async function getRuns() {
  const response = await portalApi.get("/portal/runs");
  return response.data;
}

export async function getDownloads() {
  const response = await portalApi.get("/portal/downloads");
  return response.data;
}
