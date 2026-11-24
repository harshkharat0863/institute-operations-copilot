import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type'], title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info', title?: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const newToast: Toast = { id, type, title, message };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast viewport */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none w-full px-4 sm:px-0">
        {toasts.map(toast => {
          const Icon =
            toast.type === 'success'
              ? CheckCircle2
              : toast.type === 'error'
              ? AlertCircle
              : toast.type === 'warning'
              ? AlertTriangle
              : Info;

          const typeStyles =
            toast.type === 'success'
              ? 'bg-status-green-bg border-status-green/30 text-status-green'
              : toast.type === 'error'
              ? 'bg-status-red-bg border-status-red/30 text-status-red'
              : toast.type === 'warning'
              ? 'bg-status-amber-bg border-status-amber/30 text-status-amber'
              : 'bg-surface border-border text-text';

          return (
            <div
              key={toast.id}
              className={`toast-panel pointer-events-auto flex items-start gap-2.5 p-3 rounded-[6px] shadow-lg border text-xs ${typeStyles}`}
            >
              <Icon className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="flex-1 min-w-0">
                {toast.title && <div className="font-semibold mb-0.5 text-text">{toast.title}</div>}
                <div className="text-text leading-relaxed">{toast.message}</div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-text-subtle hover:text-text p-0.5 rounded cursor-pointer transition-colors"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
