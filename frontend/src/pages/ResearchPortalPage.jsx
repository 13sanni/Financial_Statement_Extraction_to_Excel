import { API_BASE_URL } from "../config/env";
import Button from "../components/ui/Button";
import Panel from "../components/ui/Panel";
import StatusPill from "../components/ui/StatusPill";
import { downloads, runs, summaryCards, uploadQueue } from "./data/mockResearchData";

function ResearchPortalPage() {
  const sectionHeadClass = "mb-3 flex items-center justify-between gap-3";

  return (
    <div className="grid gap-4">
      <Panel className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
      </Panel>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Panel key={card.label} as="article">
            <p className="text-xs uppercase tracking-[0.04em] text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-1 text-sm text-slate-600">{card.delta}</p>
          </Panel>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel as="article">
          <div className={sectionHeadClass}>
            <h3 className="text-base font-semibold text-slate-900">Upload Queue</h3>
            <Button variant="secondary">Add Statement</Button>
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
        </Panel>

        <Panel as="article">
          <div className={sectionHeadClass}>
            <h3 className="text-base font-semibold text-slate-900">Extraction Runs</h3>
            <Button variant="primary">Start Run</Button>
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
        </Panel>

        <Panel as="article" className="lg:col-span-2">
          <div className={sectionHeadClass}>
            <h3 className="text-base font-semibold text-slate-900">Latest Excel Exports</h3>
            <Button variant="secondary">View All</Button>
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
                  <Button variant="ghost">Download</Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </section>
    </div>
  );
}

export default ResearchPortalPage;
