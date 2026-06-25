"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

type ToastVariant = "success" | "error";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>(null!);

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const success = useCallback((message: string) => push(message, "success"), [push]);
  const error = useCallback((message: string) => push(message, "error"), [push]);

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      <div className="fixed top-10 left-0 right-0 z-[100] flex flex-col items-center gap-1.5 pt-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-2 px-4 py-2.5 rounded shadow-md border-l-4 border text-sm bg-white w-full max-w-2xl mx-4"
            style={{
              borderLeftColor:
                t.variant === "success" ? "var(--aws-green)" : "var(--aws-red)",
              borderColor: "var(--aws-border-divider)",
              backgroundColor:
                t.variant === "success" ? "var(--aws-green-bg)" : "var(--aws-red-bg)",
            }}
          >
            {t.variant === "success" ? (
              <CheckCircle2
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: "var(--aws-green)" }}
              />
            ) : (
              <XCircle
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: "var(--aws-red)" }}
              />
            )}
            <span className="flex-1 font-medium" style={{ color: "var(--aws-text)" }}>
              {t.message}
            </span>
            <button
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
