import { API_BASE_URL } from "../config/env";

const summaryCards = [
  { label: "Statements Processed", value: "128", delta: "+14 this week" },
  { label: "Queued for Extraction", value: "6", delta: "2 urgent" },
  { label: "Accuracy Score", value: "98.3%", delta: "Last 30 days" },
  { label: "Excel Packages Ready", value: "41", delta: "7 generated today" },
];

const uploadQueue = [
  { company: "North Ridge Energy", period: "Q3 2025", pages: 83, uploadedBy: "A. Reed" },
  { company: "Harbor Capital Bank", period: "FY 2025", pages: 142, uploadedBy: "S. Patel" },
  { company: "Orion Retail Group", period: "Q4 2025", pages: 67, uploadedBy: "J. Kim" },
];

const runs = [
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

const downloads = [
  { file: "NorthRidge_Q3_2025.xlsx", generatedAt: "Today, 10:41 AM", size: "1.2 MB" },
  { file: "HarborCapital_FY_2025.xlsx", generatedAt: "Today, 10:05 AM", size: "1.8 MB" },
  { file: "OrionRetail_Q4_2025.xlsx", generatedAt: "Today, 9:43 AM", size: "940 KB" },
];

function StatusPill({ status }) {
  const labels = {
    completed: "Completed",
    processing: "Processing",
    review: "Needs Review",
  };

  const classes = {
    completed: "bg-emerald-100 text-emerald-800",
    processing: "bg-blue-100 text-blue-800",
    review: "bg-amber-100 text-amber-800",
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${classes[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function ResearchPortalPage() {
  const panelClass =
    "rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(28,53,84,0.08)]";
  const sectionHeadClass = "mb-3 flex items-center justify-between gap-3";
  const buttonBaseClass =
    "cursor-pointer rounded-lg border px-3 py-2 text-xs font-medium transition-colors";
  const secondaryButtonClass = `${buttonBaseClass} border-transparent bg-blue-100 text-blue-700 hover:bg-blue-200`;
  const primaryButtonClass = `${buttonBaseClass} border-transparent bg-blue-600 text-white hover:bg-blue-700`;
  const ghostButtonClass = `${buttonBaseClass} border-slate-200 bg-white text-slate-700 hover:bg-slate-100`;

  return (
    <div className="grid gap-4">
      <section className={`${panelClass} flex flex-col gap-4 md:flex-row md:items-start md:justify-between`}>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Research Portal</h2>
          <p className="mt-2 text-sm text-slate-600">
            Monitor uploads, extraction runs, and generated Excel outputs in one workspace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
            Backend API
          </span>
          <code className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm">
            {API_BASE_URL}
          </code>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.label} className={panelClass}>
            <p className="text-xs uppercase tracking-[0.04em] text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-1 text-sm text-slate-600">{card.delta}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className={panelClass}>
          <div className={sectionHeadClass}>
            <h3 className="text-base font-semibold text-slate-900">Upload Queue</h3>
            <button className={secondaryButtonClass} type="button">
              Add Statement
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 px-1.5 py-2 text-left text-xs font-semibold text-slate-500">
                    Company
                  </th>
                  <th className="border-b border-slate-200 px-1.5 py-2 text-left text-xs font-semibold text-slate-500">
                    Period
                  </th>
                  <th className="border-b border-slate-200 px-1.5 py-2 text-left text-xs font-semibold text-slate-500">
                    Pages
                  </th>
                  <th className="border-b border-slate-200 px-1.5 py-2 text-left text-xs font-semibold text-slate-500">
                    Uploaded By
                  </th>
                </tr>
              </thead>
              <tbody>
                {uploadQueue.map((item) => (
                  <tr key={`${item.company}-${item.period}`}>
                    <td className="whitespace-nowrap border-b border-slate-100 px-1.5 py-2 text-sm text-slate-900">
                      {item.company}
                    </td>
                    <td className="whitespace-nowrap border-b border-slate-100 px-1.5 py-2 text-sm text-slate-900">
                      {item.period}
                    </td>
                    <td className="whitespace-nowrap border-b border-slate-100 px-1.5 py-2 text-sm text-slate-900">
                      {item.pages}
                    </td>
                    <td className="whitespace-nowrap border-b border-slate-100 px-1.5 py-2 text-sm text-slate-900">
                      {item.uploadedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className={panelClass}>
          <div className={sectionHeadClass}>
            <h3 className="text-base font-semibold text-slate-900">Extraction Runs</h3>
            <button className={primaryButtonClass} type="button">
              Start Run
            </button>
          </div>
          <ul className="grid gap-3">
            {runs.map((run) => (
              <li
                key={run.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{run.company}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {run.id} · Started {run.started}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <StatusPill status={run.status} />
                  <p className="mt-1 text-xs text-slate-600">Confidence {run.confidence}</p>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className={`${panelClass} lg:col-span-2`}>
          <div className={sectionHeadClass}>
            <h3 className="text-base font-semibold text-slate-900">Latest Excel Exports</h3>
            <button className={secondaryButtonClass} type="button">
              View All
            </button>
          </div>
          <ul className="grid gap-3">
            {downloads.map((download) => (
              <li
                key={download.file}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{download.file}</p>
                  <p className="mt-1 text-xs text-slate-600">Generated {download.generatedAt}</p>
                </div>
                <div className="flex items-center gap-3 text-left sm:text-right">
                  <span className="text-sm text-slate-700">{download.size}</span>
                  <button className={ghostButtonClass} type="button">
                    Download
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}

export default ResearchPortalPage;
