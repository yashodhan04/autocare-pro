import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, X, Send, Pencil, Trash2, GitBranch, UserCheck } from 'lucide-react';
import { Page } from '../components/common/Page.jsx';
import { LinkButton } from '../components/common/LinkButton.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { FormDialog } from '../components/common/FormDialog.jsx';
import { TotalsSummary } from '../features/jobs/TotalsSummary.jsx';
import { SectionCard } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ConfirmDialog, ErrorState } from '../components/ui/States.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { del, post, parseError } from '../services/api.js';
import { formatDateTime, formatMoney, humanize } from '../utils/format.js';

export default function EstimateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { role, hasRole } = useAuth();
  const isCustomer = role === 'customer';
  const isAdvisor = hasRole('super_admin', 'workshop_admin', 'service_advisor');
  const res = useFetch(`/estimates/${id}`);
  const siblings = useFetch(res.data ? '/estimates' : null, { job: res.data?.job?._id, limit: 50 });
  const [decision, setDecision] = useState(null); // 'approve' | 'reject' | 'approve-behalf' | 'reject-behalf'
  const [discard, setDiscard] = useState(false);

  if (res.loading && !res.data) return <Page><Skeleton className="h-8 w-60" /><Skeleton className="h-64 w-full" /></Page>;
  if (res.error) return <Page><ErrorState title="Estimate not found" message={res.error} /></Page>;
  const e = res.data;
  const hasOpenRevision = (siblings.data ?? []).some((x) => ['draft', 'pending_approval'].includes(x.status));
  const canDecide = e.status === 'pending_approval' && (isCustomer || isAdvisor);

  const run = async (fn, ok) => { try { await fn(); toast.success(ok); res.reload(); siblings.reload(); } catch (err) { toast.error('Action failed', parseError(err).message); } };

  return (
    <Page title={`Estimate ${e.estimateNo}`} badge={<><StatusBadge status={e.status} size="md" /><Badge variant="neutral">Revision {e.revision}</Badge></>}
      description={`${e.job?.jobNo} · ${e.vehicle?.registrationNumber} · ${e.customer?.name}`}
      actions={<>
        <LinkButton to={isCustomer ? '/app/estimates' : `/app/service-jobs/${e.job?._id}`} variant="outline" size="sm" icon={<ArrowLeft size={15} />}>{isCustomer ? 'All estimates' : 'Job card'}</LinkButton>
        {isAdvisor && e.status === 'draft' && <>
          <LinkButton to={`/app/estimates/${id}/edit`} variant="outline" size="sm" icon={<Pencil size={15} />}>Edit</LinkButton>
          <Button size="sm" variant="outline" icon={<Trash2 size={15} />} onClick={() => setDiscard(true)}>Discard</Button>
          <Button size="sm" icon={<Send size={15} />} onClick={() => run(() => post(`/estimates/${id}/submit`), 'Sent for customer approval')}>Send for approval</Button></>}
        {isAdvisor && ['approved', 'rejected'].includes(e.status) && !hasOpenRevision && <LinkButton to={`/app/estimates/new?from=${id}`} size="sm" icon={<GitBranch size={15} />}>Create revision</LinkButton>}
      </>}>

      {canDecide && (
        <div className="rounded-2xl border-2 border-brand-lime bg-brand-lime-muted/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" role="region" aria-label="Approval required">
          <div><p className="font-semibold text-text-primary">{isCustomer ? 'Your approval is needed' : 'Waiting for customer approval'}</p>
            <p className="text-body-sm text-text-secondary">Total {formatMoney(e.total)}. Repair work will not begin until this estimate is approved.</p></div>
          <div className="flex gap-2 flex-wrap">
            {isCustomer ? <>
              <Button variant="outline" icon={<X size={16} />} onClick={() => setDecision('reject')}>Reject</Button>
              <Button icon={<Check size={16} />} onClick={() => setDecision('approve')}>Approve estimate</Button></> : <>
              <Button variant="outline" size="sm" icon={<UserCheck size={15} />} onClick={() => setDecision('reject-behalf')}>Record rejection</Button>
              <Button size="sm" icon={<UserCheck size={15} />} onClick={() => setDecision('approve-behalf')}>Record approval on behalf</Button></>}
          </div>
        </div>
      )}

      <SectionCard title="Line items" noPadding>
        <div className="overflow-x-auto"><table className="w-full text-body-sm">
          <caption className="sr-only">Estimate line items</caption>
          <thead><tr className="bg-surface-muted/60 text-left text-overline uppercase text-text-muted"><th className="px-4 py-3">Item</th><th className="px-4 py-3">Type</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Unit price</th><th className="px-4 py-3 text-right">Amount</th></tr></thead>
          <tbody className="divide-y divide-border">{e.lines.map((l, i) => (
            <tr key={i}><td className="px-4 py-3">{l.description}</td><td className="px-4 py-3"><Badge size="sm" variant={l.kind === 'part' ? 'info' : 'neutral'}>{humanize(l.kind)}</Badge></td>
              <td className="px-4 py-3 text-right">{l.quantity}</td><td className="px-4 py-3 text-right">{formatMoney(l.unitPrice)}</td><td className="px-4 py-3 text-right font-medium">{formatMoney(l.amount)}</td></tr>))}</tbody>
        </table></div>
        <div className="p-5 border-t border-border flex justify-end"><TotalsSummary {...e} /></div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {(e.notes || e.recommendations) && (
          <SectionCard title="Notes & recommendations">
            {e.notes && <p className="text-body-sm whitespace-pre-line">{e.notes}</p>}
            {e.recommendations && <p className="text-body-sm whitespace-pre-line mt-3 text-text-secondary"><strong className="text-text-primary">Recommendations: </strong>{e.recommendations}</p>}
          </SectionCard>
        )}
        <SectionCard title="Approval history" subtitle="Every decision is timestamped and recorded">
          <ol className="space-y-3">{e.decisions.map((d, i) => (
            <li key={i} className="flex gap-3 text-body-sm"><span className="w-2 h-2 rounded-full bg-brand-charcoal mt-2 shrink-0" aria-hidden="true" />
              <div><p><strong>{humanize(d.action)}</strong> by {d.by?.name ?? 'system'}{d.onBehalf ? ' (on behalf of customer)' : ''}</p><p className="text-caption text-text-muted">{formatDateTime(d.at)}</p>{d.note && <p className="text-text-secondary mt-0.5">“{d.note}”</p>}</div></li>))}
            {!e.decisions.length && <li className="text-text-muted text-body-sm">No decisions yet.</li>}</ol>
        </SectionCard>
      </div>

      {(siblings.data?.length ?? 0) > 1 && (
        <SectionCard title="All revisions for this job" noPadding>
          <ul className="divide-y divide-border">{siblings.data.map((s) => (
            <li key={s._id}><button type="button" onClick={() => navigate(`/app/estimates/${s._id}`)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface-muted/50 text-left">
              <span className="text-body-sm">Revision {s.revision} · {formatMoney(s.total)}{s._id === id && <span className="text-text-muted"> (viewing)</span>}</span><StatusBadge status={s.status} /></button></li>))}</ul>
        </SectionCard>
      )}

      <FormDialog open={Boolean(decision)} onClose={() => setDecision(null)} size="sm" key={decision}
        title={decision?.startsWith('approve') ? 'Approve estimate' : 'Reject estimate'}
        description={decision?.endsWith('behalf') ? 'Record how the customer decided (e.g. phone call, in person).' : decision === 'approve' ? `You are approving ${formatMoney(e.total)}.` : 'Tell the workshop why so they can revise the estimate.'}
        fields={[{ name: 'note', label: decision?.endsWith('behalf') ? 'How was this confirmed?' : 'Comment', type: 'textarea', required: decision?.endsWith('behalf') || decision === 'reject', span: 2 }]}
        submitLabel={decision?.startsWith('approve') ? 'Confirm approval' : 'Confirm rejection'}
        onSubmit={async ({ note }) => { await post(`/estimates/${id}/decision`, { decision: decision.startsWith('approve') ? 'approve' : 'reject', note }); toast.success(decision.startsWith('approve') ? 'Estimate approved' : 'Estimate rejected'); res.reload(); siblings.reload(); }} />
      <ConfirmDialog open={discard} onClose={() => setDiscard(false)} danger title="Discard draft?" message="This draft estimate will be permanently deleted." confirmLabel="Discard"
        onConfirm={async () => { await run(() => del(`/estimates/${id}`), 'Draft discarded'); navigate(`/app/service-jobs/${e.job?._id}`); }} />
    </Page>
  );
}
