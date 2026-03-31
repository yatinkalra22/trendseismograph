'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

type ToastItem = {
  id: number;
  message: string;
};

type ErrorToastContextValue = {
  showError: (message: string) => void;
};

const ErrorToastContext = createContext<ErrorToastContextValue | undefined>(undefined);

export function ErrorToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showError = useCallback((message: string) => {
    const normalized = message.trim();
    if (!normalized) return;

    setToasts((current) => {
      if (current.some((toast) => toast.message === normalized)) {
        return current;
      }
      const id = nextId.current;
      nextId.current += 1;
      return [...current, { id, message: normalized }].slice(-3);
    });

    const idForTimeout = nextId.current - 1;
    setTimeout(() => dismissToast(idForTimeout), 5000);
  }, [dismissToast]);

  const value = useMemo(() => ({ showError }), [showError]);

  return (
    <ErrorToastContext.Provider value={value}>
      {children}
      <div className="fixed top-20 right-4 z-[100] flex w-[min(92vw,420px)] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm shadow-lg backdrop-blur"
            role="status"
            aria-live="polite"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
            <p className="flex-1 text-red-100">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-red-200/90 transition-colors hover:text-red-100"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ErrorToastContext.Provider>
  );
}

export function useErrorToast() {
  const ctx = useContext(ErrorToastContext);
  if (!ctx) {
    throw new Error('useErrorToast must be used within ErrorToastProvider');
  }
  return ctx;
}
