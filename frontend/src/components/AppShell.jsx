function AppShell({ children, headerMiddle = null, headerActions = null }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-white">
            Research Ops
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
            FSE Tool
          </h1>
        </div>
        {headerMiddle ? <div className="lg:flex-1 lg:px-6">{headerMiddle}</div> : null}
        {headerActions ? <div className="self-start lg:self-center">{headerActions}</div> : null}
      </header>
      <main className="mt-6">{children}</main>
    </div>
  );
}

export default AppShell;
