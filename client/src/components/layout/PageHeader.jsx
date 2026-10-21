import { cn } from '../../utils/cn.js';

/**
 * PageHeader — Consistent header component for application pages.
 *
 * @param {Object} props
 * @param {string|React.ReactNode} props.title - Primary page title
 * @param {string|React.ReactNode} [props.description] - Subtitle or supporting text
 * @param {React.ReactNode} [props.badge] - Optional status badge next to title
 * @param {React.ReactNode} [props.actions] - Action buttons aligned to the right
 * @param {string} [props.className] - Additional classes
 */
export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 pb-6 border-b border-border sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-body-sm text-text-muted max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 pt-1 sm:pt-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
