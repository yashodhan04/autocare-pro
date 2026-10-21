import { cn } from '../../utils/cn.js';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumbs — Navigation breadcrumb trail.
 *
 * Props:
 *   items   Array<{ label: string, href?: string, icon?: ReactNode }>
 *   className string
 *
 * The last item is treated as the current page (non-linked).
 */
export function Breadcrumbs({ items = [], className }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className="flex items-center gap-1 flex-wrap">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;

          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight
                  size={14}
                  className="text-text-muted shrink-0"
                  aria-hidden="true"
                />
              )}

              {isLast ? (
                <span
                  className="text-caption font-medium text-text-primary flex items-center gap-1"
                  aria-current="page"
                >
                  {item.icon && <span className="shrink-0" aria-hidden="true">{item.icon}</span>}
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href || '#'}
                  className={cn(
                    'text-caption text-text-muted hover:text-text-primary transition-colors duration-150',
                    'flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime',
                  )}
                >
                  {i === 0 && !item.icon ? (
                    <Home size={13} aria-hidden="true" />
                  ) : item.icon ? (
                    <span className="shrink-0" aria-hidden="true">{item.icon}</span>
                  ) : null}
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
