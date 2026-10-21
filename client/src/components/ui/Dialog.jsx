import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

/**
 * Dialog — Accessible modal dialog component.
 *
 * Props:
 *   open        boolean               — controls visibility
 *   onClose     () => void            — called on Escape / backdrop / cancel
 *   title       string                — dialog heading
 *   description string                — optional subtitle
 *   size        'sm' | 'md' | 'lg' | 'xl'   default: 'md'
 *   actions     ReactNode             — footer action buttons slot
 *   hideClose   boolean               — hides the X button
 *   children    ReactNode             — dialog body content
 */

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  size = 'md',
  actions,
  hideClose = false,
  children,
}) {
  const dialogRef = useRef(null);
  const previousFocus = useRef(null);

  // Focus trap & escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose?.();
      return;
    }

    if (e.key === 'Tab') {
      const focusable = dialogRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }, [onClose]);

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      // Focus first focusable element
      requestAnimationFrame(() => {
        const firstFocusable = dialogRef.current?.querySelector(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        firstFocusable?.focus();
      });
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'dialog-title' : undefined}
      aria-describedby={description ? 'dialog-description' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-overlay animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full bg-surface-card rounded-2xl',
          'animate-scale-in',
          'flex flex-col max-h-[90vh]',
          sizeMap[size] || sizeMap.md,
        )}
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        {/* Header */}
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border shrink-0">
            <div className="min-w-0">
              {title && (
                <h2 id="dialog-title" className="text-h4 font-semibold text-text-primary">
                  {title}
                </h2>
              )}
              {description && (
                <p id="dialog-description" className="text-body-sm text-text-muted mt-1">
                  {description}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 btn-icon text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
                aria-label="Close dialog"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {actions && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-surface-muted/50 rounded-b-2xl shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
