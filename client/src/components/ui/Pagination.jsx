import { cn } from '../../utils/cn.js';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

/**
 * Pagination — Page navigation control.
 *
 * Props:
 *   page        number          — current page (1-indexed)
 *   totalPages  number
 *   onChange    (page) => void
 *   siblingCount number         — pages shown each side of current, default 1
 *   showEdges   boolean         — always show first/last page buttons, default true
 *   className   string
 */

function range(start, end) {
  const arr = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
}

function buildPages(page, totalPages, siblingCount = 1) {
  const totalShown = siblingCount * 2 + 5; // siblings + current + 2 edges + 2 ellipsis

  if (totalPages <= totalShown) return range(1, totalPages);

  const leftSibling  = Math.max(page - siblingCount, 1);
  const rightSibling = Math.min(page + siblingCount, totalPages);

  const showLeft  = leftSibling > 2;
  const showRight = rightSibling < totalPages - 1;

  const pages = [1];

  if (showLeft)  pages.push('...');
  else           pages.push(...range(2, leftSibling));

  pages.push(...range(leftSibling, rightSibling));

  if (showRight) pages.push('...');
  else           pages.push(...range(rightSibling, totalPages - 1));

  pages.push(totalPages);

  // Deduplicate
  return [...new Set(pages)];
}

export function Pagination({ page, totalPages, onChange, siblingCount = 1, className }) {
  if (totalPages <= 1) return null;

  const pages = buildPages(page, totalPages, siblingCount);

  const navBtn = (label, disabled, onClick, icon) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center w-9 h-9 rounded-lg text-body-sm',
        'border border-border transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime focus-visible:ring-offset-1',
        disabled
          ? 'opacity-40 cursor-not-allowed bg-surface-card text-text-muted'
          : 'bg-surface-card text-text-secondary hover:bg-surface-muted hover:text-text-primary cursor-pointer',
      )}
    >
      {icon}
    </button>
  );

  return (
    <nav aria-label="Pagination" className={cn('flex items-center gap-1.5', className)}>
      {navBtn('Previous page', page <= 1, () => onChange?.(page - 1), <ChevronLeft size={16} />)}

      {pages.map((p, i) =>
        p === '...' ? (
          <span
            key={`ellipsis-${i}`}
            className="inline-flex items-center justify-center w-9 h-9 text-text-muted"
            aria-hidden="true"
          >
            <MoreHorizontal size={16} />
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange?.(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'inline-flex items-center justify-center w-9 h-9 rounded-lg text-body-sm font-medium',
              'border transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime focus-visible:ring-offset-1',
              p === page
                ? 'bg-brand-charcoal text-white border-brand-charcoal'
                : 'bg-surface-card border-border text-text-secondary hover:bg-surface-muted hover:text-text-primary',
            )}
          >
            {p}
          </button>
        ),
      )}

      {navBtn('Next page', page >= totalPages, () => onChange?.(page + 1), <ChevronRight size={16} />)}
    </nav>
  );
}
