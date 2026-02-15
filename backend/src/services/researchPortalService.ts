type SummaryCard = {
  label: string;
  value: string;
  delta: string;
};

type UploadQueueItem = {
  company: string;
  period: string;
  pages: number;
  uploadedBy: string;
};

type RunItem = {
  id: string;
  company: string;
  started: string;
  status: "processing" | "completed" | "review";
  confidence: string;
};

type DownloadItem = {
  file: string;
  generatedAt: string;
  size: string;
};

const summaryCards: SummaryCard[] = [
  { label: "Statements Processed", value: "128", delta: "+14 this week" },
  { label: "Queued for Extraction", value: "6", delta: "2 urgent" },
  { label: "Accuracy Score", value: "98.3%", delta: "Last 30 days" },
  { label: "Excel Packages Ready", value: "41", delta: "7 generated today" },
];

const uploadQueue: UploadQueueItem[] = [
  { company: "North Ridge Energy", period: "Q3 2025", pages: 83, uploadedBy: "A. Reed" },
  { company: "Harbor Capital Bank", period: "FY 2025", pages: 142, uploadedBy: "S. Patel" },
  { company: "Orion Retail Group", period: "Q4 2025", pages: 67, uploadedBy: "J. Kim" },
];

const runs: RunItem[] = [
  {
    id: "RUN-2318",
    company: "North Ridge Energy",
    started: "10:32 AM",
    status: "processing",
    confidence: "97.9%",
  },
  {
    id: "RUN-2317",
    company: "Harbor Capital Bank",
    started: "9:58 AM",
    status: "completed",
    confidence: "99.1%",
  },
  {
    id: "RUN-2316",
    company: "Orion Retail Group",
    started: "9:21 AM",
    status: "review",
    confidence: "95.8%",
  },
];

const downloads: DownloadItem[] = [
  { file: "NorthRidge_Q3_2025.xlsx", generatedAt: "Today, 10:41 AM", size: "1.2 MB" },
  { file: "HarborCapital_FY_2025.xlsx", generatedAt: "Today, 10:05 AM", size: "1.8 MB" },
  { file: "OrionRetail_Q4_2025.xlsx", generatedAt: "Today, 9:43 AM", size: "940 KB" },
];

function cloneRows<T extends Record<string, unknown>>(rows: T[]): T[] {
  return rows.map((row) => ({ ...row }));
}

export function getPortalSummary(): SummaryCard[] {
  return cloneRows(summaryCards);
}

export function getPortalUploadQueue(): UploadQueueItem[] {
  return cloneRows(uploadQueue);
}

export function getPortalRuns(): RunItem[] {
  return cloneRows(runs);
}

export function getPortalDownloads(): DownloadItem[] {
  return cloneRows(downloads);
}
