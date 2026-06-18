import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: AlertCircle,
  };

  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    info: 'bg-accent-light border-hairline text-muted',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
  };

  const iconColors = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    info: 'text-accent-amber',
    warning: 'text-amber-500',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-24 md:bottom-6 right-6 z-[200] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => {
            const Icon = icons[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 100, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={cn(
                  "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm",
                  colors[t.type]
                )}
              >
                <Icon size={20} className={cn("shrink-0 mt-0.5", iconColors[t.type])} />
                <p className="text-sm font-semibold flex-1">{t.message}</p>
                <button
                  onClick={() => removeToast(t.id)}
                  className="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
