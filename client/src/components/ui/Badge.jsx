import { cn } from '../../utils/cn.js';

/**
 * Badge — Status indicator pill / badge.
 *
 * Props:
 *   variant   'default' | 'success' | 'warning' | 'danger' | 'info' | 'lime' | 'neutral'
 *   pill      boolean  — fully rounded
 *   size      'sm' | 'md'
 *   dot       boolean  — shows a leading coloured dot
 *   className string
 *   children  ReactNode
 */

const variantStyles = {
  default: 'bg-surface-muted text-text-secondary border border-border',
  neutral: 'bg-surface-muted text-text-secondary border border-border',
  success: 'bg-success-muted text-success-text border border-success-muted',
  warning: 'bg-warning-muted text-warning-text border border-warning-muted',
  danger:  'bg-danger-muted  text-danger-text  border border-danger-muted',
  info:    'bg-info-muted    text-info-text    border border-info-muted',
  lime:    'bg-brand-lime-muted text-brand-charcoal border border-brand-lime',
};

const dotColors = {
  default: 'bg-text-muted',
  neutral: 'bg-text-muted',
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
  info:    'bg-info',
  lime:    'bg-brand-lime',
};

export function Badge({ variant = 'default', pill = false, size = 'md', dot = false, className, children }) {
  return (
    <span
      className={cn(
        pill ? 'badge-pill' : 'badge',
        size === 'sm' && 'text-[0.7rem] px-2 py-px',
        variantStyles[variant] || variantStyles.default,
        className,
      )}
    >
      {dot && (
        <span
          className={cn('inline-block w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant] || dotColors.default)}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
