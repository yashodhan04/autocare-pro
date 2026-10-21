import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Phone, Mail, MapPin } from 'lucide-react';
import { LinkButton } from '../components/common/LinkButton.jsx';
import { Page, DetailList } from '../components/common/Page.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { FormDialog } from '../components/common/FormDialog.jsx';
import { vehicleFields } from '../features/vehicles/vehicleFields.js';
import { SectionCard } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { ErrorState, EmptyState } from '../components/ui/States.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { post } from '../services/api.js';
import { formatDate, formatMoney } from '../utils/format.js';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { hasRole } = useAuth();
  const canEdit = hasRole('super_admin', 'workshop_admin', 'service_advisor');
  const cust = useFetch(`/customers/${id}`);
  const hist = useFetch(`/customers/${id}/history`);
  const [tab, setTab] = useState('jobs');
  const [addVehicle, setAddVehicle] = useState(false);

  if (cust.loading && !cust.data) return <Page><Skeleton className="h-8 w-60" /><Skeleton className="h-48 w-full" /></Page>;
  if (cust.error) return <Page><ErrorState title="Customer not found" message={cust.error} action={<Button size="sm" variant="outline" onClick={() => navigate('/app/customers')}>Back to customers</Button>} /></Page>;
  const c = cust.data;

  return (
    <Page title={c.name} badge={<StatusBadge status={c.isActive ? 'active' : 'inactive'} />} description={`Customer since ${formatDate(c.createdAt)}`}
      actions={<LinkButton to="/app/customers" variant="outline" size="sm" icon={<ArrowLeft size={15} />}>All customers</LinkButton>}>
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Contact" className="lg:col-span-1">
          <ul className="space-y-3 text-body-sm">
            <li className="flex gap-2.5"><Phone size={16} className="text-text-muted mt-0.5" aria-hidden="true" />{c.phone}</li>
            <li className="flex gap-2.5"><Mail size={16} className="text-text-muted mt-0.5" aria-hidden="true" />{c.email ?? '—'}</li>
            <li className="flex gap-2.5"><MapPin size={16} className="text-text-muted mt-0.5" aria-hidden="true" />{c.address ?? '—'}</li>
          </ul>
          <div className="mt-5 pt-5 border-t border-border"><DetailList columns={2} items={[['Total jobs', c.stats.totalJobs], ['Open jobs', c.stats.openJobs], ['Notes', c.notes]]} /></div>
        </SectionCard>

        <SectionCard title="Vehicles" className="lg:col-span-2" noPadding action={canEdit && <Button size="sm" variant="outline" icon={<Plus size={14} />} onClick={() => setAddVehicle(true)}>Add vehicle</Button>}>
          {c.vehicles.length === 0 ? <EmptyState compact title="No vehicles registered" message="Register this customer's vehicle to book services." /> : (
            <ul className="divide-y divide-border">
              {c.vehicles.map((v) => (
                <li key={v._id}><Link to={`/app/vehicles/${v._id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-surface-muted/50">
                  <div><p className="font-medium text-text-primary">{v.make} {v.model} <span className="text-text-muted font-normal">({v.year})</span></p><p className="text-caption text-text-muted">{v.registrationNumber} · {v.fuelType} · {v.odometer.toLocaleString('en-IN')} km</p></div>
                  <span className="text-caption text-text-secondary">View history →</span>
                </Link></li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="space-y-4">
        <h2 className="text-h4 font-semibold">Service history</h2>
        <Tabs variant="pill" size="sm" active={tab} onChange={setTab} tabs={[{ id: 'jobs', label: 'Jobs' }, { id: 'invoices', label: 'Invoices' }, { id: 'appointments', label: 'Appointments' }]} />
        {tab === 'jobs' && <DataTable loading={hist.loading} error={hist.error} rows={hist.data?.jobs} emptyTitle="No jobs yet" onRowClick={(j) => navigate(`/app/service-jobs/${j._id}`)} columns={[
          { key: 'jobNo', header: 'Job', className: 'font-mono text-caption' }, { key: 'vehicle', header: 'Vehicle', render: (j) => j.vehicle?.registrationNumber }, { key: 'checkInAt', header: 'Checked in', render: (j) => formatDate(j.checkInAt), hideBelow: 'md' },
          { key: 'status', header: 'Status', render: (j) => <StatusBadge status={j.status} /> }]} />}
        {tab === 'invoices' && <DataTable loading={hist.loading} error={hist.error} rows={hist.data?.invoices} emptyTitle="No invoices yet" onRowClick={(i) => navigate(`/app/invoices/${i._id}`)} columns={[
          { key: 'invoiceNo', header: 'Invoice', className: 'font-mono text-caption' }, { key: 'issuedAt', header: 'Issued', render: (i) => formatDate(i.issuedAt) }, { key: 'total', header: 'Total', align: 'right', render: (i) => formatMoney(i.total) },
          { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} /> }]} />}
        {tab === 'appointments' && <DataTable loading={hist.loading} error={hist.error} rows={hist.data?.appointments} emptyTitle="No appointments yet" columns={[
          { key: 'start', header: 'When', render: (a) => formatDate(a.start) }, { key: 'service', header: 'Service', render: (a) => a.service?.name }, { key: 'vehicle', header: 'Vehicle', render: (a) => a.vehicle?.registrationNumber, hideBelow: 'md' },
          { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> }]} />}
      </div>

      <FormDialog open={addVehicle} onClose={() => setAddVehicle(false)} title="Register vehicle" description={`For ${c.name}`} fields={vehicleFields()} initial={{ vehicleType: 'car', odometer: 0 }} submitLabel="Register vehicle"
        onSubmit={async (v) => { await post('/vehicles', { ...v, customer: id }); toast.success('Vehicle registered'); cust.reload(); }} />
    </Page>
  );
}
