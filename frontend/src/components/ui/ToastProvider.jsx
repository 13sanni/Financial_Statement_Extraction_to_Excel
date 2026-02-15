import { useCallback, useMemo, useState } from "react";
import { ToastContext } from "./toastContext";

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, options = {}) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const type = options.type || "info";
    const duration = options.duration ?? 3200;
    const toast = { id, message, type };

    setToasts((current) => [...current, toast]);
    window.setTimeout(() => dismissToast(id), duration);
  }, [dismissToast]);

  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[999] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-lg border px-3 py-2 text-sm shadow-[0_10px_30px_rgba(0,0,0,0.7)] ${
              toast.type === "error"
                ? "border-white bg-black text-white"
                : toast.type === "success"
                  ? "border-white bg-white text-black"
                  : "border-slate-700 bg-black text-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p>{toast.message}</p>
              <button
                type="button"
                className="rounded border border-slate-600 px-1.5 py-0.5 text-[11px]"
                onClick={() => dismissToast(toast.id)}
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
