const variantClasses = {
  primary: "border-white bg-white text-black shadow-[0_8px_20px_rgba(255,255,255,0.12)] hover:bg-slate-200 hover:shadow-[0_10px_24px_rgba(255,255,255,0.2)]",
  secondary: "border-slate-600 bg-slate-800 text-white shadow-[0_6px_16px_rgba(0,0,0,0.6)] hover:bg-slate-700 hover:shadow-[0_8px_20px_rgba(0,0,0,0.75)]",
  ghost: "border-slate-700 bg-black text-slate-200 shadow-[0_5px_14px_rgba(0,0,0,0.55)] hover:bg-slate-900 hover:text-white hover:shadow-[0_8px_20px_rgba(0,0,0,0.8)]",
};

function Button({ type = "button", variant = "secondary", className = "", children, ...props }) {
  return (
    <button
      type={type}
      className={`cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
