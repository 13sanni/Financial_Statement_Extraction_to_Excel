function Panel({ as: Component = "section", className = "", children }) {
  const Tag = Component;
  return (
    <Tag
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(28,53,84,0.08)] ${className}`}
    >
      {children}
    </Tag>
  );
}

export default Panel;
