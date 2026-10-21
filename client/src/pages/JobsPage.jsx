import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Page } from '../components/common/Page.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { FilterBar } from '../components/common/FilterBar.jsx';
import { FormDialog } from '../components/common/FormDialog.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { JOB_STATUS_OPTIONS, PRIORITY_OPTIONS } from '../config/options.js';
import { useList } from '../hooks/useList.js';
import { useFetch } from '../hooks/useFetch.js';
import { useOptions } from '../hooks/useOptions.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { post } from '../services/api.js';
import { formatDate, toDateInput } from '../utils/format.js';

/** Fields for the check-in form. Customer/vehicle pickers are replaced by appointment details when checking in a booking. */
export function jobFields({ fromAppointment, customerOptions, vehicleOptions, mechanicOptions }) {
  return [
    ...(fromAppointment ? [] : [
      { name: 'customer', label: 'Customer', type: 'select', required: true, options: customerOptions },
      { name: 'vehicle', label: 'Vehicle', type: 'select', required: true, options: vehicleOptions, helper: 'Pick a customer first' },
    ]),
    { name: 'reportedProblem', label: 'Reported problem', type: 'textarea', required: true },
    { name: 'odometerIn', label: 'Odometer at check-in (km)', type: 'number', required: true, min: 0 },
    { name: 'priority', label: 'Priority', type: 'select', required: true, options: PRIORITY_OPTIONS },
    { name: 'assignedMechanic', label: 'Assign mechanic', type: 'select', options: mechanicOptions },
    { name: 'expectedCompletion', label: 'Expected completion', type: 'date', min: toDateInput() },
    { name: 'internalNotes', label: 'Internal notes (not visible to customer)', type: 'textarea' },
  ];
}

export default function JobsPage() {
  const { role, hasRole } = useAuth();
  const canCreate = hasRole('super_admin', 'workshop_admin', 'service_advisor');
  const [params, setParams] = useSearchParams();
  const checkin = params.get('checkin');
  const list = useList('/jobs', { status: '' });
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState('');

  const appt = useFetch(checkin && canCreate ? '/appointments' : null, { status: 'confirmed', limit: 100 });
  const booked = useMemo(() => (appt.data ?? []).find((a) => a._id === checkin), [appt.data, checkin]);
  useEffect(() => { if (checkin && canCreate) setOpen(true); }, [checkin, canCreate]);

  const { options: customerOptions } = useOptions(open && !checkin ? '/customers' : null, (c) => ({ value: c._id, label: `${c.name} · ${c.phone}` }));
  const { options: vehicleOptions } = useOptions(open && !checkin && customer ? '/vehicles' : null, (v) => ({ value: v._id, label: `${v.registrationNumber} — ${v.make} ${v.model}` }), { limit: 100, customer });
  const { options: mechanicOptions } = useOptions(open ? '/users/staff' : null, (m) => ({ value: m._id, label: m.name }), {});

  const createdId = useRef(null);
  const close = () => {
    setOpen(false); setCustomer('');
    if (createdId.current) { const id = createdId.current; createdId.current = null; navigate(`/app/service-jobs/${id}`); return; }
    if (checkin) { params.delete('checkin'); setParams(params, { replace: true }); } };

  const columns = [
    { key: 'jobNo', header: 'Job', render: (j) => <div><p className="font-mono text-caption font-semibold text-text-primary">{j.jobNo}</p><p className="text-caption text-text-muted">{formatDate(j.checkInAt)}</p></div> },
    { key: 'vehicle', header: 'Vehicle', render: (j) => <div><p className="font-medium">{j.vehicle?.registrationNumber}</p><p className="text-caption text-text-muted">{j.vehicle?.make} {j.vehicle?.model}</p></div> },
    ...(role !== 'customer' ? [{ key: 'customer', header: 'Customer', hideBelow: 'md', render: (j) => j.customer?.name }] : []),
    { key: 'problem', header: 'Problem', hideBelow: 'lg', render: (j) => <span className="line-clamp-1 max-w-xs">{j.reportedProblem}</span> },
    { key: 'mechanic', header: 'Mechanic', hideBelow: 'lg', render: (j) => j.assignedMechanic?.name ?? <span className="text-text-muted">Unassigned</span> },
    { key: 'priority', header: 'Priority', hideBelow: 'md', render: (j) => <StatusBadge status={j.priority} /> },
    { key: 'status', header: 'Status', render: (j) => <StatusBadge status={j.status} /> },
  ];

  return (
    <Page title={role === 'customer' ? 'My service jobs' : 'Service jobs'} description="Job cards from check-in through quality check, invoicing and delivery."
      actions={canCreate && <Button icon={<Plus size={16} />} onClick={() => setOpen(true)}>New job card</Button>}>
      <FilterBar list={list} placeholder="Search job no., registration or problem…" selects={[{ name: 'status', label: 'All statuses', options: [{ value: 'active', label: 'Active (open)' }, ...JOB_STATUS_OPTIONS] }, { name: 'priority', label: 'Any priority', options: PRIORITY_OPTIONS }]} />
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} pagination={list.pagination} onPageChange={list.setPage} onRowClick={(j) => navigate(`/app/service-jobs/${j._id}`)} caption="Service jobs"
        emptyTitle="No service jobs" emptyMessage="Job cards appear here after a vehicle is checked in." />

      <FormDialog open={open && (!checkin || Boolean(booked) || appt.error)} onClose={close} size="lg" title={checkin ? 'Check in from appointment' : 'New job card'}
        description={booked ? `${booked.vehicle?.registrationNumber} · ${booked.service?.name} · ${booked.customer?.name}` : undefined}
        key={`${checkin}-${booked?._id}`} onFieldChange={(n, v) => { if (n === 'customer') setCustomer(v); }}
        fields={jobFields({ fromAppointment: Boolean(checkin), customerOptions, vehicleOptions, mechanicOptions })}
        initial={{ priority: 'normal', reportedProblem: booked?.issue ?? '', odometerIn: booked?.vehicle?.odometer ?? '' }}
        submitLabel="Create job card" onSubmit={async (v) => { const r = await post('/jobs', { ...v, appointment: checkin || undefined }); toast.success('Job card created', r.data.jobNo); createdId.current = r.data._id; }} />
    </Page>
  );
}
