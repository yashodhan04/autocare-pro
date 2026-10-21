import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil } from 'lucide-react';
import { Page } from '../components/common/Page.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { FilterBar } from '../components/common/FilterBar.jsx';
import { FormDialog } from '../components/common/FormDialog.jsx';
import { Button } from '../components/ui/Button.jsx';
import { vehicleFields } from '../features/vehicles/vehicleFields.js';
import { FUEL_OPTIONS } from '../config/options.js';
import { useList } from '../hooks/useList.js';
import { useOptions } from '../hooks/useOptions.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { patch, post } from '../services/api.js';

export default function VehiclesPage() {
  const { role, hasRole } = useAuth();
  const isCustomer = role === 'customer';
  const canWrite = isCustomer || hasRole('super_admin', 'workshop_admin', 'service_advisor');
  const list = useList('/vehicles');
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const { options: customerOptions } = useOptions(canWrite && !isCustomer ? '/customers' : null, (c) => ({ value: c._id, label: `${c.name} · ${c.phone}` }));

  const columns = [
    { key: 'registrationNumber', header: 'Registration', render: (v) => <span className="font-mono font-semibold text-text-primary">{v.registrationNumber}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (v) => <div><p className="font-medium">{v.make} {v.model}</p><p className="text-caption text-text-muted">{v.year} · {v.fuelType}</p></div> },
    ...(!isCustomer ? [{ key: 'customer', header: 'Owner', hideBelow: 'md', render: (v) => v.customer?.name }] : []),
    { key: 'odometer', header: 'Odometer', hideBelow: 'lg', align: 'right', render: (v) => `${v.odometer.toLocaleString('en-IN')} km` },
    ...(canWrite ? [{ key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', render: (v) => (
      <div onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="sm" iconOnly aria-label={`Edit ${v.registrationNumber}`} icon={<Pencil size={15} />} onClick={() => setForm(v)} /></div>
    ) }] : []),
  ];

  return (
    <Page title={isCustomer ? 'My vehicles' : 'Vehicles'} description="Registered vehicles, odometer readings and service history." actions={canWrite && <Button icon={<Plus size={16} />} onClick={() => setForm({ vehicleType: 'car', odometer: 0 })}>Register vehicle</Button>}>
      <FilterBar list={list} placeholder="Search registration, make, model or VIN…" selects={[{ name: 'fuelType', label: 'All fuel types', options: FUEL_OPTIONS }]} />
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} pagination={list.pagination} onPageChange={list.setPage}
        onRowClick={(v) => navigate(`/app/vehicles/${v._id}`)} caption="Vehicles"
        emptyTitle={list.filters.q ? 'No vehicles match your search' : 'No vehicles registered'} emptyMessage={isCustomer ? 'Register your vehicle to book a service.' : 'Vehicles appear here once registered.'}
        emptyAction={canWrite && !list.filters.q && <Button size="sm" onClick={() => setForm({ vehicleType: 'car', odometer: 0 })}>Register vehicle</Button>} />
      <FormDialog open={Boolean(form)} onClose={() => setForm(null)} size="lg" title={form?._id ? `Edit ${form.registrationNumber}` : 'Register vehicle'}
        fields={vehicleFields({ customerOptions: isCustomer ? undefined : customerOptions, editing: Boolean(form?._id) })} initial={form ?? {}} submitLabel={form?._id ? 'Save changes' : 'Register vehicle'}
        onSubmit={async (v) => { await (form._id ? patch(`/vehicles/${form._id}`, v) : post('/vehicles', v)); toast.success(form._id ? 'Vehicle updated' : 'Vehicle registered'); list.reload(); }} />
    </Page>
  );
}
