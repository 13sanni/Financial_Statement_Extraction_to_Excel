function AuthCard({ title, subtitle, children }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(28,53,84,0.08)]">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        {children}
      </section>
    </div>
  );
}

export default AuthCard;
