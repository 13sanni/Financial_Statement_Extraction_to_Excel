function AppShell({ children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-eyebrow">Internal Research Portal</p>
        <h1>Financial Statement Extraction Tool</h1>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}

export default AppShell;
