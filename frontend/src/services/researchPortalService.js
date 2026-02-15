import {
  downloads as mockDownloads,
  runs as mockRuns,
  summaryCards as mockSummaryCards,
  uploadQueue as mockUploadQueue,
} from "../pages/data/mockResearchData";

function cloneRows(rows) {
  return rows.map((row) => ({ ...row }));
}

export async function getSummary() {
  return cloneRows(mockSummaryCards);
}

export async function getUploadQueue() {
  return cloneRows(mockUploadQueue);
}

export async function getRuns() {
  return cloneRows(mockRuns);
}

export async function getDownloads() {
  return cloneRows(mockDownloads);
}
