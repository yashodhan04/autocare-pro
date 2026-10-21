import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, UserX, UserCheck } from 'lucide-react';
import { Page } from '../components/common/Page.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { FilterBar } from '../components/common/FilterBar.jsx';
import { FormDialog } from '../components/common/FormDialog.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ConfirmDialog } from '../components/ui/States.jsx';
import { useList } from '../hooks/useList.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { del, patch, post, parseError } from '../services/api.js';
import { formatDate } from '../utils/format.js';
import { PHONE_PATTERN } from '../config/options.js';

export const customerFields = [
  { name: 'name', label: 'Full name', required: true },
  { name: 'phone', label: 'Phone', type: 'tel', required: true, pattern: PHONE_PATTERN, patternMessage: 'Enter a valid phone number', placeholder: '+91 98765 43210' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'address', label: 'Address' },
  { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
];

export default function CustomersPage() {
  const list = useList('/customers', { active: 'true' });
  const { hasRole } = useAuth();
  const canEdit = hasRole('super_admin', 'workshop_admin', 'service_advisor');
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(null); // null | {} (create) | customer (edit)
  const [confirm, setConfirm] = useState(null);

  async function toggleActive(c) {
    try {
      if (c.isActive) await del(`/customers/${c._id}`); else await patch(`/customers/${c._id}`, { isActive: true });
      toast.success(c.isActive ? 'Customer deactivated' : 'Customer reactivated');
      list.reload();
    } catch (e) { toast.error('Action failed', parseError(e).message); }
    setConfirm(null);
  }

  const columns = [
    { key: 'name', header: 'Customer', render: (c) => <div><p className="font-medium text-text-primary">{c.name}</p><p className="text-caption text-text-muted md:hidden">{c.phone}</p></div> },
    { key: 'phone', header: 'Phone', hideBelow: 'md' },
    { key: 'email', header: 'Email', hideBelow: 'lg' },
    { key: 'createdAt', header: 'Since', hideBelow: 'lg', render: (c) => formatDate(c.createdAt) },
    { key: 'isActive', header: 'Status', render: (c) => <StatusBadge status={c.isActive ? 'active' : 'inactive'} /> },
    ...(canEdit ? [{ key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', render: (c) => (
      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" iconOnly aria-label={`Edit ${c.name}`} onClick={() => setForm(c)} icon={<Pencil size={15} />} />
        <Button variant="ghost" size="sm" iconOnly aria-label={`${c.isActive ? 'Deactivate' : 'Reactivate'} ${c.name}`} onClick={() => (c.isActive ? setConfirm(c) : toggleActive(c))} icon={c.isActive ? <UserX size={15} /> : <UserCheck size={15} />} />
      </div>
    ) }] : []),
  ];

  return (
    <Page title="Customers" description="Customer profiles, vehicles and service history." actions={canEdit && <Button icon={<Plus size={16} />} onClick={() => setForm({})}>Add customer</Button>}>
      <FilterBar list={list} placeholder="Search name, phone or email…" selects={[{ name: 'active', label: 'All statuses', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] }]} />
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} pagination={list.pagination} onPageChange={list.setPage}
        onRowClick={(c) => navigate(`/app/customers/${c._id}`)} caption="Customers"
        emptyTitle={list.filters.q ? 'No customers match your search' : 'No customers yet'} emptyMessage={list.filters.q ? 'Try a different name, phone number or email.' : 'Add your first customer to start booking services.'}
        emptyAction={canEdit && !list.filters.q && <Button size="sm" onClick={() => setForm({})}>Add customer</Button>} />

      <FormDialog open={Boolean(form)} onClose={() => setForm(null)} title={form?._id ? 'Edit customer' : 'Add customer'} fields={customerFields} initial={form ?? {}}
        submitLabel={form?._id ? 'Save changes' : 'Create customer'}
        onSubmit={async (v) => { await (form._id ? patch(`/customers/${form._id}`, v) : post('/customers', v)); toast.success(form._id ? 'Customer updated' : 'Customer created'); list.reload(); }} />
      <ConfirmDialog open={Boolean(confirm)} onClose={() => setConfirm(null)} onConfirm={() => toggleActive(confirm)} danger title="Deactivate customer?" message={`${confirm?.name} will be hidden from active lists. Their history is kept and they can be reactivated.`} confirmLabel="Deactivate" />
    </Page>
  );
}
