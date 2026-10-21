import { cn } from '../../utils/cn.js';
import { PackageOpen, AlertCircle, CheckCircle2, ServerCrash } from 'lucide-react';
import { Dialog } from './Dialog.jsx';
import { Button } from './Button.jsx';

/**
 * EmptyState — Placeholder for empty data states.
 *
 * Props:
 *   icon      ReactNode    — optional custom icon
 *   title     string
 *   message   string
 *   action    ReactNode    — CTA button slot
 *   compact   boolean      — smaller layout for inline use
 *   className string
 */
export function EmptyState({ icon, title, message, action, compact = false, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4 gap-2' : 'py-16 px-6 gap-3',
        className,
      )}
    >
      <div className={cn(
        'flex items-center justify-center rounded-2xl bg-surface-muted text-text-muted',
        compact ? 'w-12 h-12 mb-0' : 'w-16 h-16 mb-1',
      )}>
        {icon || <PackageOpen size={compact ? 22 : 28} aria-hidden="true" />}
      </div>
      <div>
        <p className={cn('font-semibold text-text-primary', compact ? 'text-body-sm' : 'text-body-lg')}>
          {title || 'Nothing here yet'}
        </p>
        {message && (
          <p className={cn('text-text-muted mt-1', compact ? 'text-xs' : 'text-body-sm')}>
            {message}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/**
 * ErrorState — Inline error display.
 *
 * Props:
 *   title   string
 *   message string
 *   action  ReactNode
 *   className string
 */
export function ErrorState({ title, message, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6 gap-3',
        className,
      )}
    >
      <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-danger-light text-danger">
        <ServerCrash size={26} aria-hidden="true" />
      </div>
      <div>
        <p className="font-semibold text-text-primary text-body-lg">
          {title || 'Something went wrong'}
        </p>
        {message && (
          <p className="text-body-sm text-text-muted mt-1 max-w-sm">{message}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/**
 * SuccessState — Inline success display.
 */
export function SuccessState({ title, message, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6 gap-3',
        className,
      )}
    >
      <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-success-light text-success">
        <CheckCircle2 size={26} aria-hidden="true" />
      </div>
      <div>
        <p className="font-semibold text-text-primary text-body-lg">
          {title || 'Done!'}
        </p>
        {message && (
          <p className="text-body-sm text-text-muted mt-1 max-w-sm">{message}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/**
 * ConfirmDialog — Confirmation prompt (wraps Dialog).
 * Import Dialog separately; this is a thin semantic wrapper.
 *
 * Props:
 *   open        boolean
 *   onClose     () => void
 *   onConfirm   () => void
 *   title       string
 *   message     string
 *   confirmLabel string   default: 'Confirm'
 *   cancelLabel  string   default: 'Cancel'
 *   danger       boolean  — makes confirm button red
 *   loading      boolean
 */
export function ConfirmDialog({

  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  danger = false,
  loading = false,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={message}
      size="sm"
      actions={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
