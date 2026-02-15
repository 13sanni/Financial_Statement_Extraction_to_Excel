const variantClasses = {
  primary: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
  secondary: "border-transparent bg-blue-100 text-blue-700 hover:bg-blue-200",
  ghost: "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
};

function Button({ type = "button", variant = "secondary", className = "", children, ...props }) {
  return (
    <button
      type={type}
      className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
