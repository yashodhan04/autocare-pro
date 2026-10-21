import { cn } from '../../utils/cn.js';
import { EmptyState, ErrorState } from '../ui/States.jsx';
import { SkeletonTable } from '../ui/Skeleton.jsx';
import { Pagination } from '../ui/Pagination.jsx';

const HIDE = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' };

/**
 * DataTable — responsive table with loading / error / empty states and pagination.
 * columns: [{ key, header, render?(row), className?, hideBelow?: 'sm'|'md'|'lg', align?: 'right' }]
 */
export function DataTable({
  columns, rows, loading, error, onRetry, rowKey = '_id', onRowClick,
  emptyTitle = 'Nothing here yet', emptyMessage, emptyAction, pagination, onPageChange, caption,
}) {
  if (loading && !rows?.length) return <div className="card p-4"><SkeletonTable rows={5} cols={Math.min(columns.length, 5)} /></div>;
  if (error) return <div className="card"><ErrorState title="Couldn't load data" message={error} action={onRetry && <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>Try again</button>} /></div>;
  if (!rows?.length) return <div className="card"><EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} /></div>;

  const from = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const to = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  return (
    <div className={cn('card overflow-hidden transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
      <div className="overflow-x-auto">
        <table className="w-full text-body-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="bg-surface-muted/60 border-b border-border text-left">
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn('px-4 py-3 text-overline uppercase text-text-muted font-semibold whitespace-nowrap', c.align === 'right' && 'text-right', c.hideBelow && HIDE[c.hideBelow], c.headerClassName)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr
                key={row[rowKey]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' && e.target === e.currentTarget) onRowClick(row); } : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={cn('transition-colors', onRowClick && 'cursor-pointer hover:bg-surface-muted/50 focus-visible:outline-none focus-visible:bg-brand-lime-muted/40')}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-4 py-3 align-middle', c.align === 'right' && 'text-right', c.hideBelow && HIDE[c.hideBelow], c.className)}>
                    {c.render ? c.render(row) : row[c.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border">
          <p className="text-caption text-text-muted">Showing {from}–{to} of {pagination.total}</p>
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={onPageChange} />
        </div>
      )}
    </div>
  );
}
