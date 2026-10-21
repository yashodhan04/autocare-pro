import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Page } from '../components/common/Page.jsx';
import { LinkButton } from '../components/common/LinkButton.jsx';
import { TotalsSummary } from '../features/jobs/TotalsSummary.jsx';
import { SectionCard } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { FormField, Input, Select, Textarea } from '../components/ui/Form.jsx';
import { ErrorState } from '../components/ui/States.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useOptions } from '../hooks/useOptions.js';
import { useToast } from '../context/ToastContext.jsx';
import { post, put, parseError } from '../services/api.js';
import { previewTotals } from '../utils/money.js';
import { formatMoney } from '../utils/format.js';

const blank = (kind = 'labour') => ({ kind, description: '', inventoryItem: '', quantity: 1, unitPrice: 0 });
const strip = ({ kind, description, inventoryItem, quantity, unitPrice }) => ({ kind, description, inventoryItem: inventoryItem || undefined, quantity: Number(quantity), unitPrice: Number(unitPrice) });

/** Create / edit a draft estimate, or start a revision from an existing one (?from=ID). */
export default function EstimateEditorPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const jobId = params.get('job');
  const sourceId = id ?? params.get('from');

  const source = useFetch(sourceId ? `/estimates/${sourceId}` : null);
  const job = useFetch(jobId || source.data?.job?._id ? `/jobs/${jobId ?? source.data?.job?._id}` : null);
  const { options: parts, raw: partData } = useOptions('/inventory', (p) => ({ value: p._id, label: `${p.name} (${p.sku}) — ${p.quantity} in stock`, price: p.sellingPrice, name: p.name }));

  const [lines, setLines] = useState([blank()]);
  const [taxRate, setTaxRate] = useState(18);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [recs, setRecs] = useState('');
  const [errors, setErrors] = useState({});
  const [formErr, setFormErr] = useState(null);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    const e = source.data;
    if (!e) return;
    setLines(e.lines.map((l) => ({ ...l, inventoryItem: l.inventoryItem ?? '' })));
    setTaxRate(e.taxRate); setDiscount(e.discount); setNotes(e.notes ?? ''); setRecs(e.recommendations ?? '');
  }, [source.data]);

  const totals = useMemo(() => previewTotals(lines, taxRate, discount), [lines, taxRate, discount]);
  const setLine = (i, patch) => setLines((a) => a.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  function pickPart(i, partId) {
    const p = partData.find((x) => x._id === partId);
    setLine(i, p ? { inventoryItem: partId, description: p.name, unitPrice: p.sellingPrice } : { inventoryItem: '' });
  }

  function validate() {
    const e = {};
    lines.forEach((l, i) => {
      if (!l.description.trim()) e[`d${i}`] = 'Required';
      if (!(Number(l.quantity) > 0)) e[`q${i}`] = 'Must be > 0';
      if (!(Number(l.unitPrice) >= 0) || l.unitPrice === '') e[`p${i}`] = 'Invalid';
    });
    if (Number(taxRate) < 0 || Number(taxRate) > 100) e.tax = '0–100';
    if (Number(discount) < 0) e.discount = 'Cannot be negative';
    if (Number(discount) > totals.subtotal) e.discount = 'More than subtotal';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save(andSubmit) {
    setFormErr(null);
    if (!validate()) return setFormErr('Please fix the highlighted fields.');
    setSaving(andSubmit ? 'submit' : 'draft');
    try {
      const body = { lines: lines.map(strip), taxRate: Number(taxRate), discount: Number(discount), notes: notes || undefined, recommendations: recs || undefined };
      const isEdit = Boolean(id);
      const res = isEdit ? await put(`/estimates/${id}`, body) : await post('/estimates', { ...body, job: job.data?._id ?? jobId });
      if (andSubmit) await post(`/estimates/${res.data._id}/submit`);
      toast.success(andSubmit ? 'Estimate sent for customer approval' : 'Draft saved');
      navigate(`/app/estimates/${res.data._id}`);
    } catch (err) { setFormErr(parseError(err).message); } finally { setSaving(null); }
  }

  if ((sourceId && source.loading) || (!job.data && job.loading)) return <Page><Skeleton className="h-8 w-60" /><Skeleton className="h-64 w-full" /></Page>;
  if (source.error || job.error) return <Page><ErrorState title="Cannot load estimate" message={source.error ?? job.error} /></Page>;
  if (!jobId && !id && !sourceId) return <Page><ErrorState title="No job selected" message="Open a job card and choose “Prepare estimate”." /></Page>;
  const j = job.data;
  const revision = id ? source.data?.revision : (source.data?.revision ?? 0) + 1;

  return (
    <Page title={id ? `Edit estimate (rev ${revision})` : sourceId ? `Revise estimate → rev ${revision}` : 'Prepare estimate'} description={j ? `${j.jobNo} · ${j.vehicle?.registrationNumber} · ${j.customer?.name}` : undefined}
      actions={<LinkButton to={j ? `/app/service-jobs/${j._id}` : '/app/service-jobs'} variant="outline" size="sm" icon={<ArrowLeft size={15} />}>Back to job</LinkButton>}>
      {formErr && <div role="alert" className="rounded-lg border border-danger/30 bg-danger-light text-danger-text text-body-sm px-4 py-3">{formErr}</div>}
      {sourceId && !id && <p className="rounded-lg bg-info-light border border-info/30 text-info-text text-body-sm px-4 py-3">Revisions need the customer's re-approval. Work pauses once the revision is submitted and resumes when it is approved.</p>}

      <SectionCard title="Line items" subtitle="Labour and spare parts" noPadding>
        <div className="divide-y divide-border">
          {lines.map((l, i) => (
            <div key={i} className="p-4 grid gap-3 md:grid-cols-[7rem_1fr_6rem_8rem_8rem_auto] items-start">
              <FormField label={i === 0 ? 'Type' : undefined} htmlFor={`k${i}`}>
                <Select id={`k${i}`} value={l.kind} onChange={(e) => setLine(i, { kind: e.target.value, inventoryItem: '' })} aria-label="Line type"><option value="labour">Labour</option><option value="part">Part</option></Select>
              </FormField>
              <FormField label={i === 0 ? 'Description' : undefined} htmlFor={`d${i}`} error={errors[`d${i}`]}>
                <div className="space-y-1.5">
                  {l.kind === 'part' && <Select aria-label="Pick stock part" value={l.inventoryItem} onChange={(e) => pickPart(i, e.target.value)}><option value="">Pick from inventory (optional)…</option>{parts.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select>}
                  <Input id={`d${i}`} value={l.description} error={Boolean(errors[`d${i}`])} onChange={(e) => setLine(i, { description: e.target.value })} placeholder={l.kind === 'labour' ? 'e.g. Brake service labour' : 'Part name'} />
                </div>
              </FormField>
              <FormField label={i === 0 ? 'Qty' : undefined} htmlFor={`q${i}`} error={errors[`q${i}`]}><Input id={`q${i}`} type="number" min="0.01" step="any" value={l.quantity} error={Boolean(errors[`q${i}`])} onChange={(e) => setLine(i, { quantity: e.target.value })} /></FormField>
              <FormField label={i === 0 ? 'Unit price (₹)' : undefined} htmlFor={`p${i}`} error={errors[`p${i}`]}><Input id={`p${i}`} type="number" min="0" step="0.01" value={l.unitPrice} error={Boolean(errors[`p${i}`])} onChange={(e) => setLine(i, { unitPrice: e.target.value })} /></FormField>
              <div className={i === 0 ? 'md:pt-7' : ''}><p className="text-body-sm font-semibold text-text-primary py-2.5" aria-label="Line amount">{formatMoney((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0))}</p></div>
              <div className={i === 0 ? 'md:pt-6' : ''}><Button type="button" variant="ghost" size="sm" iconOnly aria-label={`Remove line ${i + 1}`} icon={<Trash2 size={15} />} disabled={lines.length === 1} onClick={() => setLines((a) => a.filter((_, x) => x !== i))} /></div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border flex gap-2">
          <Button type="button" variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => setLines((a) => [...a, blank('labour')])}>Add labour</Button>
          <Button type="button" variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => setLines((a) => [...a, blank('part')])}>Add part</Button>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Notes & recommendations">
          <div className="space-y-4">
            <FormField label="Notes for the customer" htmlFor="notes"><Textarea id="notes" rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} /></FormField>
            <FormField label="Recommendations" htmlFor="recs" helper="e.g. items to monitor or defer"><Textarea id="recs" rows={3} maxLength={2000} value={recs} onChange={(e) => setRecs(e.target.value)} /></FormField>
          </div>
        </SectionCard>
        <SectionCard title="Totals" subtitle="Calculated on the server when saved">
          <div className="grid grid-cols-2 gap-4 mb-5">
            <FormField label="Tax rate (%)" htmlFor="tax" error={errors.tax}><Input id="tax" type="number" min="0" max="100" step="0.01" value={taxRate} error={Boolean(errors.tax)} onChange={(e) => setTaxRate(e.target.value)} /></FormField>
            <FormField label="Discount (₹)" htmlFor="disc" error={errors.discount}><Input id="disc" type="number" min="0" step="0.01" value={discount} error={Boolean(errors.discount)} onChange={(e) => setDiscount(e.target.value)} /></FormField>
          </div>
          <div className="flex justify-end"><TotalsSummary {...totals} taxRate={Number(taxRate)} /></div>
        </SectionCard>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" loading={saving === 'draft'} disabled={Boolean(saving)} onClick={() => save(false)}>Save draft</Button>
        <Button loading={saving === 'submit'} disabled={Boolean(saving)} onClick={() => save(true)}>Save &amp; send for approval</Button>
      </div>
    </Page>
  );
}
