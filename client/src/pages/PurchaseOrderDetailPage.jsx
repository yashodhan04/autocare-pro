import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, PackageCheck, Send, Ban } from 'lucide-react';
import { Page, DetailList } from '../components/common/Page.jsx';
import { LinkButton } from '../components/common/LinkButton.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { FormDialog } from '../components/common/FormDialog.jsx';
import { SectionCard } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ConfirmDialog, ErrorState } from '../components/ui/States.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import { post, parseError } from '../services/api.js';
import { formatDate, formatDateTime, formatMoney } from '../utils/format.js';

export default function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const res = useFetch(`/purchase-orders/${id}`);
  const toast = useToast();
  const [receive, setReceive] = useState(false);
  const [cancel, setCancel] = useState(false);

  if (res.loading && !res.data) return <Page><Skeleton className="h-8 w-60" /><Skeleton className="h-48 w-full" /></Page>;
  if (res.error) return <Page><ErrorState title="Purchase order not found" message={res.error} /></Page>;
  const po = res.data;
  const open = po.lines.filter((l) => l.receivedQuantity < l.quantity);
  const act = async (action, ok) => { try { await post(`/purchase-orders/${id}/${action}`, {}); toast.success(ok); res.reload(); } catch (e) { toast.error('Action failed', parseError(e).message); } setCancel(false); };

  return (
    <Page title={<span className="font-mono">{po.poNo}</span>} badge={<StatusBadge status={po.status} size="md" />} description={`${po.supplier?.name} · created ${formatDate(po.createdAt)}${po.createdBy?.name ? ` by ${po.createdBy.name}` : ''}`}
      actions={<>
        <LinkButton to="/app/purchase-orders" variant="outline" size="sm" icon={<ArrowLeft size={15} />}>All orders</LinkButton>
        {po.status === 'draft' && <Button size="sm" icon={<Send size={15} />} onClick={() => act('order', 'Marked as ordered')}>Mark as ordered</Button>}
        {['ordered', 'partially_received'].includes(po.status) && <Button size="sm" icon={<PackageCheck size={15} />} onClick={() => setReceive(true)}>Receive goods</Button>}
        {['draft', 'ordered'].includes(po.status) && <Button size="sm" variant="ghost" icon={<Ban size={15} />} onClick={() => setCancel(true)}>Cancel</Button>}
      </>}>
      <SectionCard title="Lines" noPadding>
        <div className="overflow-x-auto"><table className="w-full text-body-sm"><caption className="sr-only">Purchase order lines</caption>
          <thead><tr className="bg-surface-muted/60 text-left text-overline uppercase text-text-muted"><th className="px-4 py-3">Part</th><th className="px-4 py-3 text-right">Ordered</th><th className="px-4 py-3 text-right">Received</th><th className="px-4 py-3 text-right">Unit cost</th><th className="px-4 py-3 text-right">Line total</th></tr></thead>
          <tbody className="divide-y divide-border">{po.lines.map((l) => <tr key={l._id}><td className="px-4 py-3"><p className="font-medium">{l.item?.name}</p><p className="text-caption text-text-muted font-mono">{l.item?.sku}</p></td><td className="px-4 py-3 text-right">{l.quantity}</td><td className="px-4 py-3 text-right">{l.receivedQuantity}</td><td className="px-4 py-3 text-right">{formatMoney(l.unitCost)}</td><td className="px-4 py-3 text-right font-medium">{formatMoney(l.quantity * l.unitCost)}</td></tr>)}</tbody>
          <tfoot><tr className="border-t border-border"><td colSpan={4} className="px-4 py-3 text-right font-semibold">Total</td><td className="px-4 py-3 text-right font-bold">{formatMoney(po.total)}</td></tr></tfoot></table></div>
      </SectionCard>
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Details"><DetailList items={[['Expected delivery', formatDate(po.expectedDate)], ['Notes', po.notes]]} /></SectionCard>
        <SectionCard title="Receipts">{po.receipts.length ? <ul className="space-y-2 text-body-sm">{po.receipts.map((r, i) => <li key={i}>{formatDateTime(r.at)} — {r.lines.reduce((s, l) => s + l.quantity, 0)} units received</li>)}</ul> : <p className="text-body-sm text-text-muted">Nothing received yet.</p>}</SectionCard>
      </div>

      {receive && <FormDialog open onClose={() => setReceive(false)} title="Receive goods" description="Enter the quantity received now. Stock is updated immediately." size="md"
        fields={open.map((l) => ({ name: l.item._id, label: `${l.item.name} (${l.quantity - l.receivedQuantity} outstanding)`, type: 'number', min: 0, max: l.quantity - l.receivedQuantity, step: 1, span: 2 }))}
        initial={Object.fromEntries(open.map((l) => [l.item._id, l.quantity - l.receivedQuantity]))} submitLabel="Receive into stock"
        onSubmit={async (v) => { const lines = Object.entries(v).filter(([, q]) => Number(q) > 0).map(([item, quantity]) => ({ item, quantity })); if (!lines.length) throw Object.assign(new Error(), { response: { data: { message: 'Enter at least one received quantity' } } }); await post(`/purchase-orders/${id}/receive`, { lines }); toast.success('Stock updated'); res.reload(); }} />}
      <ConfirmDialog open={cancel} onClose={() => setCancel(false)} danger title="Cancel purchase order?" message="This cannot be undone." confirmLabel="Cancel order" cancelLabel="Keep" onConfirm={() => act('cancel', 'Purchase order cancelled')} />
    </Page>
  );
}
