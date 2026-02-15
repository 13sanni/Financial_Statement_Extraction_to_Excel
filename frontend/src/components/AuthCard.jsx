import financeBg from "../assets/finance-bg.svg";

function AuthCard({ title, subtitle, children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <img
        src={financeBg}
        alt="Financial market background"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative mx-auto flex min-h-screen max-w-md items-center px-4">
        <section className="w-full rounded-2xl border border-white/20 bg-black/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur">
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          <p className="mt-1 text-sm text-white/75">{subtitle}</p>
          {children}
        </section>
      </div>
    </div>
  );
}

export default AuthCard;
