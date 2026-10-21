import { cn } from '../../utils/cn.js';

/**
 * Card — Standard content surface.
 */
export function Card({ hover = false, padding = 'p-5', className, children, ...rest }) {
  return (
    <div
      className={cn(
        hover ? 'card-hover' : 'card',
        padding,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * SectionCard — Card with a titled header section and body.
 */
export function SectionCard({ title, subtitle, action, noPadding = false, className, children }) {
  return (
    <div className={cn('card', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border">
          <div className="min-w-0">
            {title && (
              typeof title === 'string'
                ? <h3 className="text-h4 text-text-primary font-semibold truncate">{title}</h3>
                : title
            )}
            {subtitle && (
              <p className="text-caption text-text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn(!noPadding && 'p-5')}>
        {children}
      </div>
    </div>
  );
}

/**
 * MetricCard — KPI/stat display card.
 */
export function MetricCard({ label, value, delta, deltaType = 'neutral', icon, iconColor = 'bg-brand-lime-muted', className }) {
  const deltaColors = {
    up:      'text-success',
    down:    'text-danger',
    neutral: 'text-text-muted',
  };

  return (
    <div className={cn('card-hover p-5 flex items-start justify-between gap-4', className)}>
      <div className="min-w-0 flex-1">
        <p className="text-overline text-text-muted uppercase mb-2">{label}</p>
        <p className="text-h2 font-bold text-text-primary leading-none">{value}</p>
        {delta && (
          <p className={cn('text-caption mt-2 font-medium', deltaColors[deltaType])}>
            {delta}
          </p>
        )}
      </div>
      {icon && (
        <div className={cn('shrink-0 w-11 h-11 rounded-xl flex items-center justify-center', iconColor)}>
          {icon}
        </div>
      )}
    </div>
  );
}
