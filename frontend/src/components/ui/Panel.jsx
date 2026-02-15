function Panel({ as: Component = "section", className = "", children }) {
  const Tag = Component;
  return (
    <Tag
      className={`rounded-2xl border border-slate-800 bg-black/85 p-5 shadow-[0_12px_34px_rgba(0,0,0,0.7)] backdrop-blur transition-all duration-200 hover:border-slate-600 hover:shadow-[0_16px_40px_rgba(255,255,255,0.08)] ${className}`}
    >
      {children}
    </Tag>
  );
}

export default Panel;
