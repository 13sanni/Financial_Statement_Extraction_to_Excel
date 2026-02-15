import { API_BASE_URL } from "../config/env";

function ResearchPortalPage() {
  return (
    <section className="panel">
      <h2>Foundation Ready</h2>
      <p>
        Frontend scaffold is initialized. Next step is implementing document upload, extraction run,
        and Excel download.
      </p>
      <div className="meta-row">
        <span className="meta-label">Backend API</span>
        <code>{API_BASE_URL}</code>
      </div>
    </section>
  );
}

export default ResearchPortalPage;
