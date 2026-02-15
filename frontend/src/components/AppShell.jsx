function AppShell({ children }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-5">
      <header>
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-blue-700">
          Internal Research Portal
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Financial Statement Extraction Tool
        </h1>
      </header>
      <main className="mt-6">{children}</main>
    </div>
  );
}

export default AppShell;
