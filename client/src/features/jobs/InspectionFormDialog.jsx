import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { FormField, Input, Select, Textarea } from '../../components/ui/Form.jsx';
import { get, post, parseError } from '../../services/api.js';
import { cn } from '../../utils/cn.js';

const STATUS = [{ value: 'pass', label: 'Pass' }, { value: 'attention', label: 'Needs attention' }, { value: 'fail', label: 'Fail' }];
const TONE = { pass: 'border-success/40 bg-success-light', attention: 'border-warning/40 bg-warning-light', fail: 'border-danger/40 bg-danger-light' };

/** Digital inspection: checklist (component condition + comments) and recommended repairs, saved against a job. */
export function InspectionFormDialog({ open, onClose, jobId, onSaved }) {
  const [items, setItems] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [comments, setComments] = useState('');
  const [err, setErr] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErr(null); setRepairs([]); setComments('');
    get('/inspections/checklist').then((r) => setItems(r.data.map((component) => ({ component, status: 'pass', comment: '' })))).catch((e) => setErr(parseError(e).message));
  }, [open]);

  const setItem = (i, patch) => setItems((arr) => arr.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  async function submit(e) {
    e.preventDefault();
    const clean = items.filter((i) => i.component.trim());
    if (!clean.length) return setErr('Add at least one checklist item');
    const flagged = clean.filter((i) => i.status !== 'pass' && !i.comment.trim());
    if (flagged.length) return setErr(`Add a comment for "${flagged[0].component}" (marked ${flagged[0].status === 'fail' ? 'fail' : 'needs attention'})`);
    if (repairs.some((r) => !r.description.trim())) return setErr('Fill in or remove empty recommended repairs');
    setSaving(true); setErr(null);
    try {
      await post('/inspections', { job: jobId, items: clean.map((i) => ({ ...i, comment: i.comment.trim() || undefined })), recommendedRepairs: repairs, comments: comments || undefined });
      onSaved?.(); onClose();
    } catch (error) { setErr(parseError(error).message); } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onClose={onClose} size="xl" title="Vehicle inspection" description="Rate each component. Failed or attention items need a comment.">
      <form onSubmit={submit} noValidate className="space-y-5">
        {err && <div role="alert" className="rounded-lg border border-danger/30 bg-danger-light text-danger-text text-body-sm px-3 py-2.5">{err}</div>}
        <fieldset className="space-y-2">
          <legend className="form-label">Checklist</legend>
          {items.map((it, i) => (
            <div key={i} className={cn('rounded-xl border p-3 grid gap-2 sm:grid-cols-[1fr_11rem_1.4fr] items-center', TONE[it.status])}>
              <Input aria-label="Component" value={it.component} onChange={(e) => setItem(i, { component: e.target.value })} />
              <Select aria-label={`Condition of ${it.component}`} value={it.status} onChange={(e) => setItem(i, { status: e.target.value })}>{STATUS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
              <div className="flex gap-1.5">
                <Input aria-label={`Comment on ${it.component}`} placeholder="Technician comment" value={it.comment} onChange={(e) => setItem(i, { comment: e.target.value })} />
                <Button type="button" variant="ghost" size="sm" iconOnly aria-label={`Remove ${it.component}`} icon={<Trash2 size={14} />} onClick={() => setItems((a) => a.filter((_, x) => x !== i))} />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => setItems((a) => [...a, { component: '', status: 'pass', comment: '' }])}>Add item</Button>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="form-label">Recommended repairs</legend>
          {repairs.map((r, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_9rem_auto] items-center">
              <Input aria-label="Repair description" placeholder="e.g. Replace front brake pads" value={r.description} onChange={(e) => setRepairs((a) => a.map((x, idx) => (idx === i ? { ...x, description: e.target.value } : x)))} />
              <Select aria-label="Severity" value={r.severity} onChange={(e) => setRepairs((a) => a.map((x, idx) => (idx === i ? { ...x, severity: e.target.value } : x)))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select>
              <Button type="button" variant="ghost" size="sm" iconOnly aria-label="Remove repair" icon={<Trash2 size={14} />} onClick={() => setRepairs((a) => a.filter((_, x) => x !== i))} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => setRepairs((a) => [...a, { description: '', severity: 'medium' }])}>Add recommendation</Button>
        </fieldset>

        <FormField label="Technician comments" htmlFor="insp-comments"><Textarea id="insp-comments" rows={3} maxLength={2000} value={comments} onChange={(e) => setComments(e.target.value)} /></FormField>
        <div className="flex justify-end gap-3"><Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" loading={saving}>Save inspection</Button></div>
      </form>
    </Dialog>
  );
}
