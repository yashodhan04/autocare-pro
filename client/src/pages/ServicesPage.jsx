import { useState } from 'react';
import { Plus, Pencil, Power } from 'lucide-react';
import { Page } from '../components/common/Page.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { FilterBar } from '../components/common/FilterBar.jsx';
import { FormDialog } from '../components/common/FormDialog.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { SERVICE_CATEGORY_OPTIONS, VEHICLE_TYPE_OPTIONS } from '../config/options.js';
import { useList } from '../hooks/useList.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { patch, post, parseError } from '../services/api.js';
import { formatMoney, humanize } from '../utils/format.js';

const fields = [
  { name: 'name', label: 'Service name', required: true, span: 2 },
  { name: 'category', label: 'Category', type: 'select', required: true, options: SERVICE_CATEGORY_OPTIONS },
  { name: 'estimatedPrice', label: 'Estimated price (₹)', type: 'number', required: true, min: 0, step: '0.01' },
  { name: 'estimatedDurationMinutes', label: 'Duration (minutes)', type: 'number', required: true, min: 15, max: 1440, step: 15, helper: 'Used to block time in the booking calendar' },
  { name: 'vehicleTypes', label: 'Applicable vehicle types', type: 'multicheck', options: VEHICLE_TYPE_OPTIONS, validate: (v) => (v.length ? null : 'Select at least one vehicle type') },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'isActive', label: 'Status', type: 'checkbox', checkLabel: 'Active (offered to customers)' },
];

export default function ServicesPage() {
  const { hasRole, role } = useAuth();
  const canEdit = hasRole('super_admin', 'workshop_admin');
  const list = useList('/services', {}, 20);
  const toast = useToast();
  const [form, setForm] = useState(null);

  async function toggle(s) {
    try { await patch(`/services/${s._id}`, { isActive: !s.isActive }); toast.success(s.isActive ? 'Service deactivated' : 'Service activated'); list.reload(); } catch (e) { toast.error('Update failed', parseError(e).message); }
  }

  const columns = [
    { key: 'name', header: 'Service', render: (s) => <div><p className="font-medium text-text-primary">{s.name}</p>{s.description && <p className="text-caption text-text-muted line-clamp-1 max-w-md">{s.description}</p>}</div> },
    { key: 'category', header: 'Category', hideBelow: 'md', render: (s) => <Badge size="sm">{humanize(s.category)}</Badge> },
    { key: 'estimatedPrice', header: 'Est. price', align: 'right', render: (s) => formatMoney(s.estimatedPrice) },
    { key: 'estimatedDurationMinutes', header: 'Duration', hideBelow: 'sm', render: (s) => `${s.estimatedDurationMinutes} min` },
    { key: 'vehicleTypes', header: 'Vehicles', hideBelow: 'lg', render: (s) => s.vehicleTypes.join(', ') },
    ...(role !== 'customer' ? [{ key: 'isActive', header: 'Status', render: (s) => <StatusBadge status={s.isActive ? 'active' : 'inactive'} /> }] : []),
    ...(canEdit ? [{ key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', render: (s) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="sm" iconOnly aria-label={`Edit ${s.name}`} icon={<Pencil size={15} />} onClick={() => setForm(s)} />
        <Button variant="ghost" size="sm" iconOnly aria-label={`${s.isActive ? 'Deactivate' : 'Activate'} ${s.name}`} icon={<Power size={15} />} onClick={() => toggle(s)} />
      </div>) }] : []),
  ];

  return (
    <Page title="Service catalogue" description="Services offered by the workshop with estimated pricing and duration." actions={canEdit && <Button icon={<Plus size={16} />} onClick={() => setForm({ category: 'general', vehicleTypes: VEHICLE_TYPE_OPTIONS.map((o) => o.value), isActive: true })}>Add service</Button>}>
      <FilterBar list={list} placeholder="Search services…" selects={[{ name: 'category', label: 'All categories', options: SERVICE_CATEGORY_OPTIONS }, ...(role !== 'customer' ? [{ name: 'active', label: 'All statuses', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] }] : [])]} />
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} pagination={list.pagination} onPageChange={list.setPage} caption="Services"
        emptyTitle="No services found" emptyMessage={canEdit ? 'Add services so customers can book them.' : 'No services match your filters.'} />
      <FormDialog open={Boolean(form)} onClose={() => setForm(null)} size="lg" title={form?._id ? 'Edit service' : 'Add service'} fields={fields} initial={form ?? {}} submitLabel={form?._id ? 'Save changes' : 'Create service'}
        onSubmit={async (v) => { await (form._id ? patch(`/services/${form._id}`, v) : post('/services', v)); toast.success(form._id ? 'Service updated' : 'Service created'); list.reload(); }} />
    </Page>
  );
}
