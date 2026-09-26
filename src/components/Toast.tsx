'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { XIcon } from './Icons';

interface ToastOptions {
  message: string;
  tone?: 'info' | 'error';
  action?: { label: string; onClick: () => void };
}

interface Toast extends ToastOptions {
  id: number;
}

const DURATION = { info: 5000, error: 6000 };

const ToastContext = createContext<((options: ToastOptions) => void) | undefined>(undefined);

// One toast at a time — a new one replaces the current one.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const nextId = useRef(0);

  const show = useCallback((options: ToastOptions) => {
    setToast({ ...options, id: ++nextId.current });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismiss, DURATION[toast.tone ?? 'info']);
    return () => clearTimeout(timer);
  }, [toast, dismiss]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pointer-events-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {toast && (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-center gap-3 max-w-md w-full sm:w-auto pl-4 pr-2 py-2 rounded-xl shadow-lg text-sm ${
              toast.tone === 'error'
                ? 'bg-red-600 text-white dark:bg-red-700'
                : 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
            }`}
          >
            <span className="flex-1">{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action!.onClick();
                  dismiss();
                }}
                className="px-2 py-1 rounded-md font-semibold text-amber-400 dark:text-amber-600 hover:bg-white/10 dark:hover:bg-black/5"
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="p-1 rounded-md opacity-70 hover:opacity-100"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast must be used within ToastProvider');
  return show;
}
