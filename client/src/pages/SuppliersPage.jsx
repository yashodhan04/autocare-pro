import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil } from 'lucide-react';
import { Page } from '../components/common/Page.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { FilterBar } from '../components/common/FilterBar.jsx';
import { FormDialog } from '../components/common/FormDialog.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useList } from '../hooks/useList.js';
import { useToast } from '../context/ToastContext.jsx';
import { patch, post } from '../services/api.js';
import { PHONE_PATTERN } from '../config/options.js';

export const supplierFields = [
  { name: 'name', label: 'Supplier name', required: true, span: 2 }, { name: 'contactPerson', label: 'Contact person' },
  { name: 'phone', label: 'Phone', type: 'tel', pattern: PHONE_PATTERN, patternMessage: 'Enter a valid phone number' }, { name: 'email', label: 'Email', type: 'email' },
  { name: 'address', label: 'Address' }, { name: 'isActive', label: 'Status', type: 'checkbox', checkLabel: 'Active supplier' },
];

export default function SuppliersPage() {
  const list = useList('/suppliers');
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const columns = [
    { key: 'name', header: 'Supplier', render: (s) => <div><p className="font-medium text-text-primary">{s.name}</p><p className="text-caption text-text-muted">{s.contactPerson}</p></div> },
    { key: 'phone', header: 'Phone', hideBelow: 'sm' }, { key: 'email', header: 'Email', hideBelow: 'lg' },
    { key: 'isActive', header: 'Status', render: (s) => <StatusBadge status={s.isActive ? 'active' : 'inactive'} /> },
    { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', render: (s) => <span onClick={(e) => e.stopPropagation()}><Button size="sm" variant="ghost" iconOnly aria-label={`Edit ${s.name}`} icon={<Pencil size={15} />} onClick={() => setForm(s)} /></span> },
  ];
  return (
    <Page title="Suppliers" description="Parts suppliers, their contact details, supplied parts and purchase history." actions={<Button icon={<Plus size={16} />} onClick={() => setForm({ isActive: true })}>Add supplier</Button>}>
      <FilterBar list={list} placeholder="Search suppliers…" />
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} pagination={list.pagination} onPageChange={list.setPage} onRowClick={(s) => navigate(`/app/suppliers/${s._id}`)} caption="Suppliers"
        emptyTitle="No suppliers yet" emptyMessage="Add the vendors you buy spare parts from." />
      <FormDialog open={Boolean(form)} onClose={() => setForm(null)} title={form?._id ? 'Edit supplier' : 'Add supplier'} fields={supplierFields} initial={form ?? {}} key={form?._id ?? 'new'} submitLabel={form?._id ? 'Save changes' : 'Add supplier'}
        onSubmit={async (v) => { await (form._id ? patch(`/suppliers/${form._id}`, v) : post('/suppliers', v)); toast.success(form._id ? 'Supplier updated' : 'Supplier added'); list.reload(); }} />
    </Page>
  );
}
