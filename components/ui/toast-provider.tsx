"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/src/lib/storyflow/utils";

type ToastVariant = "default" | "success" | "error";

export type Toast = {
  id: number;
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  toast: (input: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: Omit<Toast, "id">) => {
      const id = Date.now();
      const next: Toast = { id, ...input };
      setToasts((list) => [...list, next]);
      setTimeout(() => remove(id), 3200);
    },
    [remove]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 flex-col gap-3">
            {toasts.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "pointer-events-auto rounded-xl border p-4 shadow-lg shadow-black/40",
                  "bg-slate-900/90 border-slate-800 backdrop-blur",
                  item.variant === "success" && "border-emerald-700/80 bg-emerald-950/70",
                  item.variant === "error" && "border-rose-700/80 bg-rose-950/70"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    {item.title && (
                      <div className="text-sm font-semibold text-white">{item.title}</div>
                    )}
                    {item.description && (
                      <div className="text-sm text-slate-200">{item.description}</div>
                    )}
                  </div>
                  <button
                    onClick={() => remove(item.id)}
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                    aria-label="Close toast"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}
