import { cn } from '../../utils/cn.js';

/**
 * Skeleton — Loading placeholder shimmer.
 *
 * Props:
 *   className string  — pass width / height / shape classes
 *   lines     number  — renders N stacked lines (text skeleton shortcut)
 */
export function Skeleton({ className, lines }) {
  if (lines) {
    return (
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'skeleton h-4',
              i === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full',
            )}
          />
        ))}
      </div>
    );
  }

  return <div className={cn('skeleton', className)} />;
}

/**
 * SkeletonCard — Pre-built card-shaped skeleton.
 */
export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton lines={3} />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * SkeletonTable — Pre-built table skeleton.
 *
 * Props:
 *   rows    number   default: 5
 *   cols    number   default: 4
 */
export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 px-5 py-3.5 border-b border-border bg-surface-muted">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3.5" style={{ flex: i === 0 ? 2 : 1 }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className={cn('flex gap-4 px-5 py-4', r < rows - 1 && 'border-b border-border')}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4" style={{ flex: c === 0 ? 2 : 1 }} />
          ))}
        </div>
      ))}
    </div>
  );
}
