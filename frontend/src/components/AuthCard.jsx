function AuthCard({ title, subtitle, children }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <section className="w-full rounded-2xl border border-slate-700 bg-slate-900/85 p-6 shadow-[0_10px_30px_rgba(2,6,23,0.5)] backdrop-blur">
        <h1 className="text-2xl font-semibold text-slate-100">{title}</h1>
        <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
        {children}
      </section>
    </div>
  );
}

export default AuthCard;
