import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { Page } from '../components/common/Page.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { FilterBar } from '../components/common/FilterBar.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Dialog } from '../components/ui/Dialog.jsx';
import { FormField, Input, Select, Textarea } from '../components/ui/Form.jsx';
import { useList } from '../hooks/useList.js';
import { useOptions } from '../hooks/useOptions.js';
import { useToast } from '../context/ToastContext.jsx';
import { post, parseError } from '../services/api.js';
import { formatDate, formatMoney } from '../utils/format.js';
import { previewTotals } from '../utils/money.js';

const STATUS = ['draft', 'ordered', 'partially_received', 'received', 'cancelled'].map((v) => ({ value: v, label: v.replace('_', ' ').replace(/^./, (c) => c.toUpperCase()) }));

function NewPODialog({ open, onClose, onCreated, defaultSupplier }) {
  const { options: suppliers } = useOptions(open ? '/suppliers' : null, (s) => ({ value: s._id, label: s.name }), { limit: 100, active: 'true' });
  const { options: parts, raw } = useOptions(open ? '/inventory' : null, (p) => ({ value: p._id, label: `${p.name} (${p.sku})` }));
  const [supplier, setSupplier] = useState(defaultSupplier ?? '');
  const [lines, setLines] = useState([{ item: '', quantity: 1, unitCost: '' }]);
  const [notes, setNotes] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [err, setErr] = useState(null);
  const [saving, setSaving] = useState(false);
  const total = previewTotals(lines.map((l) => ({ quantity: l.quantity, unitPrice: l.unitCost }))).total;
  const setLine = (i, p) => setLines((a) => a.map((l, x) => (x === i ? { ...l, ...p } : l)));

  async function submit(e) {
    e.preventDefault();
    if (!supplier) return setErr('Choose a supplier');
    const bad = lines.findIndex((l) => !l.item || !(Number(l.quantity) >= 1) || !Number.isInteger(Number(l.quantity)) || l.unitCost === '' || Number(l.unitCost) < 0);
    if (bad >= 0) return setErr(`Line ${bad + 1}: choose a part, a whole quantity ≥ 1 and a unit cost`);
    if (new Set(lines.map((l) => l.item)).size !== lines.length) return setErr('Each part can appear only once');
    setSaving(true); setErr(null);
    try {
      const r = await post('/purchase-orders', { supplier, notes: notes || undefined, expectedDate: expectedDate || undefined, lines: lines.map((l) => ({ item: l.item, quantity: Number(l.quantity), unitCost: Number(l.unitCost) })) });
      onCreated(r.data); onClose();
    } catch (error) { setErr(parseError(error).message); } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onClose={onClose} size="xl" title="New purchase order" description="Created as a draft — mark it as ordered when sent to the supplier.">
      <form onSubmit={submit} noValidate className="space-y-4">
        {err && <div role="alert" className="rounded-lg border border-danger/30 bg-danger-light text-danger-text text-body-sm px-3 py-2.5">{err}</div>}
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Supplier" htmlFor="po-sup" required><Select id="po-sup" value={supplier} onChange={(e) => setSupplier(e.target.value)}><option value="">Select supplier…</option>{suppliers.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select></FormField>
          <FormField label="Expected delivery" htmlFor="po-date"><Input id="po-date" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} /></FormField>
        </div>
        <fieldset className="space-y-2"><legend className="form-label">Lines</legend>
          {lines.map((l, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_6rem_8rem_auto] items-center">
              <Select aria-label="Part" value={l.item} onChange={(e) => { const p = raw.find((x) => x._id === e.target.value); setLine(i, { item: e.target.value, unitCost: p ? p.purchasePrice : l.unitCost }); }}><option value="">Select part…</option>{parts.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select>
              <Input aria-label="Quantity" type="number" min="1" step="1" value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} />
              <Input aria-label="Unit cost" type="number" min="0" step="0.01" placeholder="Unit cost" value={l.unitCost} onChange={(e) => setLine(i, { unitCost: e.target.value })} />
              <Button type="button" variant="ghost" size="sm" iconOnly aria-label={`Remove line ${i + 1}`} icon={<Trash2 size={14} />} disabled={lines.length === 1} onClick={() => setLines((a) => a.filter((_, x) => x !== i))} />
            </div>))}
          <Button type="button" variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => setLines((a) => [...a, { item: '', quantity: 1, unitCost: '' }])}>Add line</Button>
        </fieldset>
        <FormField label="Notes" htmlFor="po-notes"><Textarea id="po-notes" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} /></FormField>
        <div className="flex items-center justify-between pt-2"><p className="text-body font-bold">Total {formatMoney(total)}</p><div className="flex gap-3"><Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" loading={saving}>Create draft</Button></div></div>
      </form>
    </Dialog>
  );
}

export default function PurchaseOrdersPage() {
  const [params] = useSearchParams();
  const list = useList('/purchase-orders', { status: '', supplier: params.get('supplier') ?? '' });
  const navigate = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const columns = [
    { key: 'poNo', header: 'PO', render: (o) => <div><p className="font-mono text-caption font-semibold">{o.poNo}</p><p className="text-caption text-text-muted">{formatDate(o.createdAt)}</p></div> },
    { key: 'supplier', header: 'Supplier', render: (o) => o.supplier?.name },
    { key: 'lines', header: 'Items', hideBelow: 'md', render: (o) => `${o.lines.length} line${o.lines.length > 1 ? 's' : ''}` },
    { key: 'expectedDate', header: 'Expected', hideBelow: 'lg', render: (o) => formatDate(o.expectedDate) },
    { key: 'total', header: 'Total', align: 'right', render: (o) => <span className="font-semibold">{formatMoney(o.total)}</span> },
    { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
  ];
  return (
    <Page title="Purchase orders" description="Order parts from suppliers and receive deliveries into stock." actions={<Button icon={<Plus size={16} />} onClick={() => setOpen(true)}>New purchase order</Button>}>
      <FilterBar list={list} placeholder="Search PO number…" selects={[{ name: 'status', label: 'All statuses', options: STATUS }]} />
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} pagination={list.pagination} onPageChange={list.setPage} onRowClick={(o) => navigate(`/app/purchase-orders/${o._id}`)} caption="Purchase orders"
        emptyTitle="No purchase orders" emptyMessage="Create an order when stock runs low." emptyAction={<Button size="sm" onClick={() => setOpen(true)}>New purchase order</Button>} />
      <NewPODialog open={open} onClose={() => setOpen(false)} defaultSupplier={params.get('supplier')} onCreated={(po) => { toast.success('Purchase order created', po.poNo); navigate(`/app/purchase-orders/${po._id}`); }} />
    </Page>
  );
}
