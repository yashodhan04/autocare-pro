import { cn } from '../../utils/cn.js';
import { PageHeader } from '../layout/PageHeader.jsx';

/** Standard page container: header + vertical rhythm. */
export function Page({ title, description, badge, actions, className, children }) {
  return (
    <div className={cn('p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6', className)}>
      {title && <PageHeader title={title} description={description} badge={badge} actions={actions} />}
      {children}
    </div>
  );
}

/** Label/value list used on detail pages. */
export function DetailList({ items, columns = 2 }) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-4 grid-cols-1', columns === 2 && 'sm:grid-cols-2', columns === 3 && 'sm:grid-cols-3')}>
      {items.filter(Boolean).map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-overline uppercase text-text-muted">{label}</dt>
          <dd className="text-body-sm text-text-primary mt-0.5 break-words">{value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
