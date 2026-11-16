import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { triggerHaptic } from '../utils/device';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    if (toasts.length > 0) {
      const latest = toasts[toasts.length - 1];
      const timer = setTimeout(() => {
        onDismiss(latest.id);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-[300] flex flex-col space-y-2 max-w-sm w-full pointer-events-none p-2">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start space-x-3 p-3.5 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-top-2 duration-200 transition-all ${
              isSuccess
                ? 'bg-[#0f1713]/95 border-sport-500/60 text-slate-100 shadow-sport-500/10'
                : isError
                ? 'bg-[#180f11]/95 border-rose-800 text-rose-100 shadow-rose-950/30'
                : 'bg-[#10151a]/95 border-sky-800 text-sky-100 shadow-sky-950/30'
            }`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-sport-400" />}
              {isError && <AlertTriangle className="w-5 h-5 text-rose-400" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-sky-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black uppercase tracking-tight">{toast.title}</h4>
              {toast.message && (
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug break-words">
                  {toast.message}
                </p>
              )}
            </div>

            <button
              onClick={() => {
                triggerHaptic('light');
                onDismiss(toast.id);
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
