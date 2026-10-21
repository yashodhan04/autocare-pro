import { useState } from 'react';
import { Star, Check, X } from 'lucide-react';
import { Page } from '../components/common/Page.jsx';
import { FilterBar } from '../components/common/FilterBar.jsx';
import { FormDialog } from '../components/common/FormDialog.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { SectionCard } from '../components/ui/Card.jsx';
import { EmptyState, ErrorState } from '../components/ui/States.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { useList } from '../hooks/useList.js';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { patch, post, parseError } from '../services/api.js';
import { formatDate } from '../utils/format.js';

function Stars({ value }) {
  return <span role="img" aria-label={`${value} out of 5 stars`} className="inline-flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={16} aria-hidden="true" className={n <= value ? 'fill-brand-lime text-brand-charcoal' : 'text-border-strong'} />)}</span>;
}

export default function ReviewsPage() {
  const { role, hasRole } = useAuth();
  const isCustomer = role === 'customer';
  const isAdmin = hasRole('super_admin', 'workshop_admin');
  const list = useList('/reviews', { status: '' });
  const reviewable = useFetch(isCustomer ? '/reviews/reviewable' : null);
  const toast = useToast();
  const [writing, setWriting] = useState(null);

  const moderate = async (r, status) => { try { await patch(`/reviews/${r._id}/moderate`, { status }); toast.success(`Review ${status}`); list.reload(); } catch (e) { toast.error('Failed', parseError(e).message); } };
  // staff only see moderated-in reviews unless admin
  const items = isAdmin || isCustomer ? list.items : list.items.filter((r) => r.status === 'approved');

  return (
    <Page title="Reviews & feedback" description={isCustomer ? 'Tell us how your service went.' : 'Customer feedback on completed services.'}>
      {isCustomer && reviewable.data?.length > 0 && (
        <SectionCard title="Waiting for your feedback" subtitle="Delivered services you haven't reviewed yet">
          <ul className="divide-y divide-border">{reviewable.data.map((j) => (
            <li key={j._id} className="py-3 flex items-center justify-between gap-3"><div><p className="font-medium text-body-sm">{j.vehicle?.make} {j.vehicle?.model} · {j.vehicle?.registrationNumber}</p><p className="text-caption text-text-muted">{j.jobNo} · delivered {formatDate(j.deliveredAt)}</p></div><Button size="sm" onClick={() => setWriting(j)}>Write review</Button></li>))}</ul>
        </SectionCard>
      )}
      {isAdmin && <FilterBar list={list} search={false} selects={[{ name: 'status', label: 'All reviews', options: [{ value: 'pending', label: 'Pending moderation' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }] }]} />}
      {list.error ? <ErrorState title="Couldn't load reviews" message={list.error} action={<Button size="sm" variant="outline" onClick={list.reload}>Retry</Button>} />
        : items.length === 0 && !list.loading ? <div className="card"><EmptyState title="No reviews yet" message={isCustomer ? 'Your reviews will appear here after you submit them.' : 'Reviews appear after customers rate completed services.'} /></div>
        : <ul className="grid gap-4 md:grid-cols-2">{items.map((r) => (
          <li key={r._id} className="card p-5">
            <div className="flex items-start justify-between gap-3"><div><Stars value={r.rating} /><p className="text-caption text-text-muted mt-1">{r.customer?.name} · {r.job?.jobNo} · <time dateTime={r.createdAt}>{formatDate(r.createdAt)}</time></p></div>{(isAdmin || isCustomer) && <StatusBadge status={r.status} />}</div>
            {r.comment && <p className="text-body-sm mt-3 whitespace-pre-line">{r.comment}</p>}
            {isAdmin && r.status === 'pending' && <div className="flex gap-2 mt-4"><Button size="sm" icon={<Check size={14} />} onClick={() => moderate(r, 'approved')}>Approve</Button><Button size="sm" variant="outline" icon={<X size={14} />} onClick={() => moderate(r, 'rejected')}>Reject</Button></div>}
          </li>))}</ul>}
      {list.pagination?.totalPages > 1 && <Pagination page={list.pagination.page} totalPages={list.pagination.totalPages} onChange={list.setPage} />}

      <FormDialog open={Boolean(writing)} onClose={() => setWriting(null)} size="sm" title="Rate your service" description={writing && `${writing.jobNo} · ${writing.vehicle?.registrationNumber}`} key={writing?._id}
        fields={[{ name: 'rating', label: 'Rating', type: 'select', required: true, options: [5, 4, 3, 2, 1].map((n) => ({ value: n, label: `${'★'.repeat(n)}${'☆'.repeat(5 - n)}  ${['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][n]}` })), span: 2 }, { name: 'comment', label: 'Your review', type: 'textarea', span: 2 }]}
        submitLabel="Submit review" onSubmit={async (v) => { await post('/reviews', { job: writing._id, rating: Number(v.rating), comment: v.comment }); toast.success('Thanks for your feedback!', 'It will appear once approved.'); list.reload(); reviewable.reload(); }} />
    </Page>
  );
}
