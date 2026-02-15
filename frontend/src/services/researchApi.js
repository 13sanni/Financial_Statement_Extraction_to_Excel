import { API_BASE_URL } from "../config/env";
import { getAuthToken } from "./authService";

export async function runIncomeStatementExtraction({ files, mode = "auto" }) {
  const formData = new FormData();
  files.forEach((file) => formData.append("documents", file));

  const response = await fetch(
    `${API_BASE_URL}/tools/income-statement?mode=${encodeURIComponent(mode)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Extraction request failed");
  }

  const blob = await response.blob();
  const extractionMode = response.headers.get("X-Extraction-Mode") || mode;
  const warning = response.headers.get("X-Extraction-Warnings") || "";
  const runId = response.headers.get("X-Run-Id") || "";
  const outputUrl = response.headers.get("X-Output-Url") || "";
  return { blob, extractionMode, warning, runId, outputUrl };
}
