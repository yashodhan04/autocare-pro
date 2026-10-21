import { useState } from 'react';
import { Plus, Clock, Check, X, PackagePlus } from 'lucide-react';
import { SectionCard } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Checkbox, Input, Select, FormField } from '../../components/ui/Form.jsx';
import { EmptyState } from '../../components/ui/States.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { useOptions } from '../../hooks/useOptions.js';
import { useToast } from '../../context/ToastContext.jsx';
import { patch, post, parseError } from '../../services/api.js';
import { formatDateTime } from '../../utils/format.js';

/** One-line add form (text input + button) used for tasks, notes, time. */
function InlineAdd({ label, placeholder, onAdd, buttonLabel = 'Add', type = 'text', min, extra }) {
  const [v, setV] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (!String(v).trim()) return;
    setBusy(true);
    try { await onAdd(v); setV(''); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input aria-label={label} placeholder={placeholder} type={type} min={min} value={v} onChange={(e) => setV(e.target.value)} />
      {extra}
      <Button type="submit" variant="outline" loading={busy} icon={<Plus size={15} />}>{buttonLabel}</Button>
    </form>
  );
}

/**
 * Mechanic workspace panel for a job: tasks, labour time, repair notes and spare-part requests.
 * Capabilities are passed in so the server-enforced rules are mirrored in the UI.
 */
export function JobWorkPanel({ job, canWork, canIssueParts, onChange }) {
  const toast = useToast();
  const working = job.status === 'in_progress';
  const canRequest = canWork && ['approved', 'in_progress'].includes(job.status);
  const { options: parts } = useOptions(canRequest ? '/inventory' : null, (p) => ({ value: p._id, label: `${p.name} (${p.sku}) — ${p.quantity} in stock` }));
  const [part, setPart] = useState({ item: '', quantity: 1 });
  const [partBusy, setPartBusy] = useState(false);
  const [note, setNote] = useState('');

  const run = async (fn, ok) => { try { await fn(); if (ok) toast.success(ok); onChange(); } catch (e) { toast.error('Action failed', parseError(e).message); throw e; } };
  const quiet = (fn, ok) => run(fn, ok).catch(() => {});

  async function requestPart(e) {
    e.preventDefault();
    if (!part.item) return toast.error('Choose a part');
    setPartBusy(true);
    await quiet(() => post(`/jobs/${job._id}/part-requests`, { item: part.item, quantity: Number(part.quantity) }), 'Part requested');
    setPart({ item: '', quantity: 1 }); setPartBusy(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard title="Tasks" subtitle={working || !canWork ? undefined : 'Available once work starts'}>
        <ul className="space-y-2 mb-4">
          {job.tasks.map((t) => (
            <li key={t._id} className="flex items-start gap-3">
              <Checkbox id={`t-${t._id}`} checked={t.done} disabled={!canWork || !working} onChange={(e) => quiet(() => patch(`/jobs/${job._id}/tasks/${t._id}`, { done: e.target.checked }))} label={<span className={t.done ? 'line-through text-text-muted' : ''}>{t.description}</span>} />
            </li>
          ))}
          {!job.tasks.length && <li className="text-body-sm text-text-muted">No tasks recorded yet.</li>}
        </ul>
        {canWork && working && <InlineAdd label="New task" placeholder="e.g. Replace front brake pads" onAdd={(d) => run(() => post(`/jobs/${job._id}/tasks`, { description: d }))} buttonLabel="Add task" />}
      </SectionCard>

      <SectionCard title="Labour time" subtitle={`${(job.labourMinutes / 60).toFixed(1)} h logged`}>
        {job.timeLogs?.length ? <ul className="space-y-1.5 mb-4 text-body-sm">{job.timeLogs.map((t, i) => <li key={i} className="flex justify-between gap-3"><span className="flex items-center gap-2"><Clock size={14} className="text-text-muted" aria-hidden="true" />{t.minutes} min{t.note && ` — ${t.note}`}</span><span className="text-caption text-text-muted">{formatDateTime(t.at)}</span></li>)}</ul> : <p className="text-body-sm text-text-muted mb-4">No time logged yet.</p>}
        {canWork && working && <InlineAdd label="Minutes worked" placeholder="Minutes (e.g. 45)" type="number" min="1" onAdd={(m) => run(() => post(`/jobs/${job._id}/time-logs`, { minutes: Number(m) }), 'Time logged')} buttonLabel="Log time" />}
      </SectionCard>

      <SectionCard title="Spare parts" className="lg:col-span-2" noPadding>
        {job.partRequests.length === 0 ? <EmptyState compact title="No parts requested" message="Request parts from stock once the estimate is approved." /> : (
          <div className="overflow-x-auto"><table className="w-full text-body-sm"><caption className="sr-only">Part requests</caption>
            <thead><tr className="bg-surface-muted/60 text-left text-overline uppercase text-text-muted"><th className="px-4 py-3">Part</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3">Requested</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr></thead>
            <tbody className="divide-y divide-border">{job.partRequests.map((p) => (
              <tr key={p._id}><td className="px-4 py-3"><p className="font-medium">{p.item?.name}</p><p className="text-caption text-text-muted">{p.item?.sku} · {p.item?.quantity} in stock</p></td><td className="px-4 py-3 text-right">{p.quantity}</td>
                <td className="px-4 py-3 text-caption text-text-muted">{p.requestedBy?.name} · {formatDateTime(p.requestedAt)}</td><td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-right">{canIssueParts && p.status === 'requested' && <span className="inline-flex gap-1.5">
                  <Button size="sm" variant="outline" icon={<Check size={14} />} onClick={() => quiet(() => patch(`/jobs/${job._id}/part-requests/${p._id}`, { action: 'issue' }), 'Part issued')}>Issue</Button>
                  <Button size="sm" variant="ghost" icon={<X size={14} />} onClick={() => quiet(() => patch(`/jobs/${job._id}/part-requests/${p._id}`, { action: 'reject' }), 'Request rejected')}>Reject</Button></span>}</td></tr>))}</tbody></table></div>
        )}
        {canRequest && (
          <form onSubmit={requestPart} className="p-4 border-t border-border grid gap-3 sm:grid-cols-[1fr_6rem_auto] items-end">
            <FormField label="Request a part" htmlFor="pr-item"><Select id="pr-item" value={part.item} onChange={(e) => setPart((s) => ({ ...s, item: e.target.value }))}><option value="">Select part…</option>{parts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></FormField>
            <FormField label="Qty" htmlFor="pr-qty"><Input id="pr-qty" type="number" min="1" step="1" value={part.quantity} onChange={(e) => setPart((s) => ({ ...s, quantity: e.target.value }))} /></FormField>
            <Button type="submit" loading={partBusy} icon={<PackagePlus size={15} />}>Request</Button>
          </form>
        )}
      </SectionCard>

      <SectionCard title="Repair notes" className="lg:col-span-2">
        <ul className="space-y-3 mb-4">
          {job.notes?.map((n) => <li key={n._id} className="text-body-sm border-l-2 border-brand-lime pl-3"><p>{n.text}</p><p className="text-caption text-text-muted">{n.by?.name} · {formatDateTime(n.at)}</p></li>)}
          {!job.notes?.length && <li className="text-body-sm text-text-muted">No notes yet.</li>}
        </ul>
        {canWork && !['delivered', 'cancelled', 'invoiced'].includes(job.status) && (
          <form onSubmit={async (e) => { e.preventDefault(); if (note.trim()) { await quiet(() => post(`/jobs/${job._id}/notes`, { text: note }), 'Note added'); setNote(''); } }} className="flex gap-2">
            <Input aria-label="Repair note" placeholder="Add a repair note…" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} /><Button type="submit" variant="outline" icon={<Plus size={15} />}>Add note</Button>
          </form>
        )}
      </SectionCard>
    </div>
  );
}
