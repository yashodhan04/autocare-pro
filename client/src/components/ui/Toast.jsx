import { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

/**
 * Toast — Single toast notification component.
 *
 * Props:
 *   id        string | number        — unique id
 *   type      'success' | 'error' | 'warning' | 'info'   default: 'info'
 *   title     string
 *   message   string
 *   onDismiss (id) => void
 *   duration  number (ms)            — auto-dismiss duration, 0 = no auto-dismiss
 */

const toastConfig = {
  success: {
    icon:   <CheckCircle2 size={18} aria-hidden="true" />,
    styles: 'border-success/30 bg-success-light',
    iconCls:'text-success',
    titleCls:'text-success-text',
  },
  error: {
    icon:   <AlertCircle size={18} aria-hidden="true" />,
    styles: 'border-danger/30 bg-danger-light',
    iconCls:'text-danger',
    titleCls:'text-danger-text',
  },
  warning: {
    icon:   <AlertTriangle size={18} aria-hidden="true" />,
    styles: 'border-warning/30 bg-warning-light',
    iconCls:'text-warning',
    titleCls:'text-warning-text',
  },
  info: {
    icon:   <Info size={18} aria-hidden="true" />,
    styles: 'border-info/30 bg-info-light',
    iconCls:'text-info',
    titleCls:'text-info-text',
  },
};

export function Toast({ id, type = 'info', title, message, onDismiss, duration = 4000 }) {
  const cfg = toastConfig[type] || toastConfig.info;

  const dismiss = useCallback(() => onDismiss?.(id), [id, onDismiss]);

  useEffect(() => {
    if (!duration) return;
    const t = setTimeout(dismiss, duration);
    return () => clearTimeout(t);
  }, [dismiss, duration]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 w-full max-w-sm px-4 py-3.5',
        'rounded-xl border shadow-lg animate-slide-up',
        'bg-surface-card',
        cfg.styles,
      )}
    >
      <span className={cn('shrink-0 mt-0.5', cfg.iconCls)}>{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        {title && <p className={cn('text-body-sm font-semibold', cfg.titleCls)}>{title}</p>}
        {message && <p className="text-caption text-text-secondary mt-0.5">{message}</p>}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 text-text-muted hover:text-text-primary transition-colors mt-0.5"
        aria-label="Dismiss notification"
      >
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * ToastContainer — Renders active toasts in the bottom-right corner.
 *
 * Props:
 *   toasts    Array<{ id, type, title, message, duration }>
 *   onDismiss (id) => void
 */
export function ToastContainer({ toasts = [], onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-[400] flex flex-col gap-2.5 w-full max-w-sm"
    >
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/**
 * useToast — Toast state management hook.
 *
 * Returns: { toasts, toast, dismiss, dismissAll }
 */
export function useToast() {


  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const toast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => setToasts([]), []);

  return { toasts, toast, dismiss, dismissAll };
}
