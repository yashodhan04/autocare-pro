import { Link } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';
import { Page } from '../components/common/Page.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState, ErrorState } from '../components/ui/States.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useList } from '../hooks/useList.js';
import { useNotifications } from '../context/NotificationContext.jsx';
import { cn } from '../utils/cn.js';
import { formatDateTime } from '../utils/format.js';

export default function NotificationsPage() {
  const list = useList('/notifications', { unread: '' }, 20);
  const n = useNotifications();
  return (
    <Page title="Notifications" description="Appointment, estimate, job, inventory and payment updates." actions={<>
      <Button variant="outline" size="sm" onClick={() => list.setFilter('unread', list.filters.unread ? '' : 'true')}>{list.filters.unread ? 'Show all' : 'Unread only'}</Button>
      <Button size="sm" icon={<CheckCheck size={15} />} disabled={n.unread === 0} onClick={async () => { await n.markAllRead(); list.reload(); }}>Mark all read</Button></>}>
      {list.loading && !list.data ? <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
        : list.error ? <ErrorState title="Couldn't load notifications" message={list.error} action={<Button size="sm" variant="outline" onClick={list.reload}>Retry</Button>} />
        : list.items.length === 0 ? <div className="card"><EmptyState title={list.filters.unread ? 'No unread notifications' : 'No notifications yet'} message="You'll be notified here as things happen." /></div>
        : <ul className="card divide-y divide-border overflow-hidden">{list.items.map((x) => (
          <li key={x._id}><Link to={x.link || '#'} onClick={async () => { if (!x.read) { await n.markRead(x._id); list.reload(); } }} className={cn('flex gap-3 px-5 py-4 hover:bg-surface-muted/60 transition-colors', !x.read && 'bg-brand-lime-muted/30')}>
            <span className={cn('w-2.5 h-2.5 rounded-full mt-1.5 shrink-0', x.read ? 'bg-border-strong' : 'bg-brand-lime border border-brand-charcoal/30')} aria-label={x.read ? 'read' : 'unread'} />
            <div className="min-w-0"><p className="font-medium text-body-sm">{x.title}</p>{x.message && <p className="text-body-sm text-text-secondary">{x.message}</p>}<p className="text-caption text-text-muted mt-1">{formatDateTime(x.createdAt)}</p></div></Link></li>))}</ul>}
      {list.pagination?.totalPages > 1 && <Pagination page={list.pagination.page} totalPages={list.pagination.totalPages} onChange={list.setPage} />}
    </Page>
  );
}
