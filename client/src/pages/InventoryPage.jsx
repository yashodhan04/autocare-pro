import { useState } from 'react';
import { Plus, Pencil, ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { Page } from '../components/common/Page.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { FilterBar } from '../components/common/FilterBar.jsx';
import { FormDialog } from '../components/common/FormDialog.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { PART_CATEGORY_OPTIONS } from '../config/options.js';
import { useList } from '../hooks/useList.js';
import { useFetch } from '../hooks/useFetch.js';
import { useOptions } from '../hooks/useOptions.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { patch, post } from '../services/api.js';
import { formatDateTime, formatMoney, humanize } from '../utils/format.js';

const REASONS = {
  in: [['purchase', 'Purchase / delivery'], ['return', 'Customer return'], ['other', 'Other']],
  out: [['damage', 'Damaged / written off'], ['other', 'Other usage']],
  adjust: [['correction', 'Stock count correction'], ['damage', 'Damage'], ['other', 'Other']],
};
const TITLES = { in: 'Stock in', out: 'Stock out', adjust: 'Adjust stock' };

function movementFields(type, item) {
  return [
    { name: 'quantity', label: type === 'adjust' ? `New quantity (currently ${item.quantity})` : 'Quantity', type: 'number', required: true, min: type === 'adjust' ? 0 : 1, max: type === 'out' ? item.quantity : undefined, step: 1, helper: type === 'out' ? `${item.quantity} available` : undefined,
      validate: (v) => (Number.isInteger(Number(v)) ? null : 'Whole numbers only'), span: 2 },
    { name: 'reason', label: 'Reason', type: 'select', required: true, options: REASONS[type].map(([value, label]) => ({ value, label })), span: 2 },
    { name: 'note', label: 'Note', type: 'textarea', required: type === 'adjust', span: 2 },
  ];
}

function StockTab({ canWrite }) {
  const list = useList('/inventory', { status: '', category: '' });
  const toast = useToast();
  const { options: suppliers } = useOptions(canWrite ? '/suppliers' : null, (s) => ({ value: s._id, label: s.name }));
  const [form, setForm] = useState(null);
  const [move, setMove] = useState(null); // { type, item }

  const itemFields = [
    { name: 'name', label: 'Part name', required: true }, { name: 'sku', label: 'SKU', required: true, disabled: Boolean(form?._id), helper: 'Unique part code' },
    { name: 'category', label: 'Category', type: 'select', required: true, options: PART_CATEGORY_OPTIONS }, { name: 'supplier', label: 'Supplier', type: 'select', options: suppliers },
    { name: 'purchasePrice', label: 'Purchase price (₹)', type: 'number', required: true, min: 0, step: '0.01' }, { name: 'sellingPrice', label: 'Selling price (₹)', type: 'number', required: true, min: 0, step: '0.01' },
    ...(form?._id ? [] : [{ name: 'quantity', label: 'Opening stock', type: 'number', min: 0, step: 1, helper: 'Recorded as an opening-stock movement' }]),
    { name: 'reorderLevel', label: 'Reorder level', type: 'number', required: true, min: 0, step: 1 }, { name: 'location', label: 'Storage location', placeholder: 'e.g. Rack A2' },
    ...(form?._id ? [{ name: 'isActive', label: 'Status', type: 'checkbox', checkLabel: 'Active' }] : []),
  ];

  const columns = [
    { key: 'name', header: 'Part', render: (i) => <div><p className="font-medium text-text-primary">{i.name}</p><p className="text-caption text-text-muted font-mono">{i.sku}</p></div> },
    { key: 'category', header: 'Category', hideBelow: 'md', render: (i) => <Badge size="sm">{humanize(i.category)}</Badge> },
    { key: 'supplier', header: 'Supplier', hideBelow: 'lg', render: (i) => i.supplier?.name ?? '—' },
    { key: 'quantity', header: 'In stock', align: 'right', render: (i) => <div className="flex items-center justify-end gap-2"><span className="font-semibold tabular-nums">{i.quantity}</span><StatusBadge status={i.stockStatus} /></div> },
    { key: 'reorderLevel', header: 'Reorder at', hideBelow: 'lg', align: 'right' },
    { key: 'price', header: 'Price', hideBelow: 'md', align: 'right', render: (i) => <div><p>{formatMoney(i.sellingPrice)}</p><p className="text-caption text-text-muted">cost {formatMoney(i.purchasePrice)}</p></div> },
    { key: 'location', header: 'Location', hideBelow: 'lg' },
    ...(canWrite ? [{ key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', render: (i) => (
      <div className="flex justify-end gap-0.5">
        <Button size="sm" variant="ghost" iconOnly aria-label={`Stock in ${i.name}`} icon={<ArrowDownToLine size={15} />} onClick={() => setMove({ type: 'in', item: i })} />
        <Button size="sm" variant="ghost" iconOnly aria-label={`Stock out ${i.name}`} icon={<ArrowUpFromLine size={15} />} onClick={() => setMove({ type: 'out', item: i })} />
        <Button size="sm" variant="ghost" iconOnly aria-label={`Adjust ${i.name}`} icon={<SlidersHorizontal size={15} />} onClick={() => setMove({ type: 'adjust', item: i })} />
        <Button size="sm" variant="ghost" iconOnly aria-label={`Edit ${i.name}`} icon={<Pencil size={15} />} onClick={() => setForm(i)} />
      </div>) }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex-1"><FilterBar list={list} placeholder="Search name, SKU or location…" selects={[
          { name: 'category', label: 'All categories', options: PART_CATEGORY_OPTIONS },
          { name: 'status', label: 'All stock levels', options: [{ value: 'in_stock', label: 'In stock' }, { value: 'alert', label: 'Low or out of stock' }, { value: 'low_stock', label: 'Low stock' }, { value: 'out_of_stock', label: 'Out of stock' }] }]} /></div>
        {canWrite && <Button icon={<Plus size={16} />} onClick={() => setForm({ category: 'other', reorderLevel: 5 })}>Add part</Button>}
      </div>
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} pagination={list.pagination} onPageChange={list.setPage} caption="Inventory"
        emptyTitle="No parts found" emptyMessage={list.filters.q || list.filters.status ? 'Try changing your filters.' : 'Add spare parts to start tracking stock.'} />

      <FormDialog open={Boolean(form)} onClose={() => setForm(null)} size="lg" title={form?._id ? `Edit ${form.sku}` : 'Add part'} fields={itemFields} initial={form ? { ...form, supplier: form.supplier?._id ?? '' } : {}} key={form?._id ?? 'new'} submitLabel={form?._id ? 'Save changes' : 'Add part'}
        onSubmit={async (v) => { await (form._id ? patch(`/inventory/${form._id}`, v) : post('/inventory', v)); toast.success(form._id ? 'Part updated' : 'Part added'); list.reload(); }} />
      {move && <FormDialog open onClose={() => setMove(null)} size="sm" title={`${TITLES[move.type]} — ${move.item.name}`} description={`SKU ${move.item.sku} · currently ${move.item.quantity} in stock`} fields={movementFields(move.type, move.item)} initial={{ reason: REASONS[move.type][0][0] }} submitLabel="Record movement"
        onSubmit={async (v) => { const r = await post(`/inventory/${move.item._id}/movements`, { type: move.type, ...v }); toast.success('Stock updated', `${move.item.name}: ${r.data.item.quantity} in stock`); list.reload(); }} />}
    </div>
  );
}

function MovementsTab() {
  const list = useList('/inventory/movements', { type: '' }, 15);
  const columns = [
    { key: 'createdAt', header: 'When', render: (m) => <span className="whitespace-nowrap">{formatDateTime(m.createdAt)}</span> },
    { key: 'item', header: 'Part', render: (m) => <div><p className="font-medium">{m.item?.name}</p><p className="text-caption text-text-muted font-mono">{m.item?.sku}</p></div> },
    { key: 'type', header: 'Type', render: (m) => <Badge size="sm" variant={m.type === 'in' ? 'success' : m.type === 'out' ? 'warning' : 'info'}>{humanize(m.type)}</Badge> },
    { key: 'delta', header: 'Change', align: 'right', render: (m) => <span className={m.delta >= 0 ? 'text-success font-semibold' : 'text-danger font-semibold'}>{m.delta > 0 ? '+' : ''}{m.delta}</span> },
    { key: 'balanceAfter', header: 'Balance', align: 'right' },
    { key: 'reason', header: 'Reason', hideBelow: 'md', render: (m) => humanize(m.reason) },
    { key: 'by', header: 'By', hideBelow: 'lg', render: (m) => m.by?.name ?? '—' },
    { key: 'note', header: 'Note', hideBelow: 'lg', render: (m) => <span className="line-clamp-1 max-w-[14rem]">{m.note ?? '—'}</span> },
  ];
  return (
    <div className="space-y-4">
      <FilterBar list={list} search={false} selects={[{ name: 'type', label: 'All movements', options: [{ value: 'in', label: 'Stock in' }, { value: 'out', label: 'Stock out' }, { value: 'adjust', label: 'Adjustments' }] }]} />
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} pagination={list.pagination} onPageChange={list.setPage} caption="Stock movements" emptyTitle="No stock movements" emptyMessage="Every stock-in, stock-out and adjustment is recorded here." />
    </div>
  );
}

export default function InventoryPage() {
  const { hasRole } = useAuth();
  const canWrite = hasRole('super_admin', 'workshop_admin', 'inventory_manager');
  const [tab, setTab] = useState('stock');
  const alerts = useFetch('/inventory/alerts');
  return (
    <Page title="Inventory" description="Spare-parts stock, reorder alerts and the full movement ledger.">
      {alerts.data?.length > 0 && (
        <div className="rounded-2xl border border-warning/40 bg-warning-light p-4 flex gap-3" role="status">
          <AlertTriangle className="text-warning shrink-0 mt-0.5" size={20} aria-hidden="true" />
          <div><p className="font-semibold text-warning-text">{alerts.data.length} part{alerts.data.length > 1 ? 's' : ''} at or below reorder level</p>
            <p className="text-body-sm text-warning-text/90">{alerts.data.slice(0, 5).map((i) => `${i.name} (${i.quantity})`).join(', ')}{alerts.data.length > 5 ? '…' : ''}</p></div>
        </div>
      )}
      {canWrite ? <Tabs variant="pill" size="sm" active={tab} onChange={setTab} tabs={[{ id: 'stock', label: 'Stock' }, { id: 'movements', label: 'Movement history' }]} /> : null}
      {tab === 'stock' ? <StockTab canWrite={canWrite} /> : <MovementsTab />}
    </Page>
  );
}
