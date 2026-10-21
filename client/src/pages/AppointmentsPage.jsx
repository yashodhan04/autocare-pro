import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Check, X, CalendarClock, ClipboardPlus, Ban } from 'lucide-react';
import { Page } from '../components/common/Page.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { FilterBar } from '../components/common/FilterBar.jsx';
import { FormDialog } from '../components/common/FormDialog.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { BookingDialog } from '../features/appointments/BookingDialog.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ConfirmDialog } from '../components/ui/States.jsx';
import { APPT_STATUS_OPTIONS } from '../config/options.js';
import { useList } from '../hooks/useList.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { patch, post, parseError } from '../services/api.js';
import { formatDateTime } from '../utils/format.js';

const CUTOFF_MS = 2 * 3600 * 1000;

export default function AppointmentsPage() {
  const { role, hasRole } = useAuth();
  const isCustomer = role === 'customer';
  const isStaff = hasRole('super_admin', 'workshop_admin', 'service_advisor');
  const [params, setParams] = useSearchParams();
  const list = useList('/appointments', { sort: 'asc' });
  const toast = useToast();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(false);
  const [resched, setResched] = useState(null);
  const [reject, setReject] = useState(null);
  const [cancel, setCancel] = useState(null);

  const defaultVehicle = params.get('book');
  useEffect(() => { if (defaultVehicle) setBooking(true); }, [defaultVehicle]);
  const closeBooking = () => { setBooking(false); if (defaultVehicle) { params.delete('book'); setParams(params, { replace: true }); } };

  async function act(fn, ok) {
    try { await fn(); toast.success(ok); list.reload(); } catch (e) { toast.error('Action failed', parseError(e).message); }
  }
  const status = (a, s, reason) => act(() => patch(`/appointments/${a._id}/status`, { status: s, reason }), `Appointment ${s.replace('_', ' ')}`);
  const editable = (a) => ['pending', 'confirmed'].includes(a.status) && (!isCustomer || new Date(a.start) - Date.now() >= CUTOFF_MS);

  const columns = [
    { key: 'start', header: 'When', render: (a) => <div><p className="font-medium text-text-primary"><time dateTime={a.start}>{formatDateTime(a.start)}</time></p><p className="text-caption text-text-muted font-mono">{a.appointmentNo}</p></div> },
    ...(!isCustomer ? [{ key: 'customer', header: 'Customer', hideBelow: 'md', render: (a) => a.customer?.name }] : []),
    { key: 'vehicle', header: 'Vehicle', render: (a) => <div><p>{a.vehicle?.registrationNumber}</p><p className="text-caption text-text-muted">{a.vehicle?.make} {a.vehicle?.model}</p></div> },
    { key: 'service', header: 'Service', hideBelow: 'sm', render: (a) => a.service?.name },
    { key: 'status', header: 'Status', render: (a) => <div><StatusBadge status={a.status} />{a.statusReason && <p className="text-caption text-text-muted mt-1 max-w-[12rem]">{a.statusReason}</p>}</div> },
    { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', render: (a) => (
      <div className="flex justify-end gap-1 flex-wrap">
        {isStaff && a.status === 'pending' && <>
          <Button size="sm" variant="outline" icon={<Check size={14} />} onClick={() => status(a, 'confirmed')}>Confirm</Button>
          <Button size="sm" variant="ghost" icon={<X size={14} />} onClick={() => setReject(a)}>Reject</Button></>}
        {isStaff && ['pending', 'confirmed'].includes(a.status) && <Button size="sm" variant="primary" icon={<ClipboardPlus size={14} />} onClick={() => navigate(`/app/service-jobs?checkin=${a._id}`)}>Check in</Button>}
        {isStaff && a.status === 'confirmed' && <Button size="sm" variant="ghost" iconOnly aria-label="Mark no-show" icon={<Ban size={14} />} onClick={() => status(a, 'no_show')} />}
        {editable(a) && <Button size="sm" variant="ghost" iconOnly aria-label="Reschedule" icon={<CalendarClock size={15} />} onClick={() => setResched(a)} />}
        {editable(a) && <Button size="sm" variant="ghost" iconOnly aria-label="Cancel appointment" icon={<X size={15} />} onClick={() => setCancel(a)} />}
      </div>) },
  ];

  return (
    <Page title={isCustomer ? 'My appointments' : 'Appointments'} description={isCustomer ? 'Book services and track their status. Changes are allowed up to 2 hours before the start time.' : 'Confirm, reschedule and check in booked vehicles.'}
      actions={<Button icon={<Plus size={16} />} onClick={() => setBooking(true)}>{isCustomer ? 'Book a service' : 'New booking'}</Button>}>
      <FilterBar list={list} search={false} selects={[{ name: 'status', label: 'All statuses', options: APPT_STATUS_OPTIONS }, { name: 'sort', label: 'Sort', options: [{ value: 'asc', label: 'Soonest first' }, { value: 'desc', label: 'Latest first' }] }]} />
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} pagination={list.pagination} onPageChange={list.setPage} caption="Appointments"
        emptyTitle="No appointments" emptyMessage={isCustomer ? 'Book your first service — it only takes a minute.' : 'No appointments match the current filters.'} emptyAction={<Button size="sm" onClick={() => setBooking(true)}>{isCustomer ? 'Book a service' : 'New booking'}</Button>} />

      <BookingDialog open={booking} onClose={closeBooking} onDone={() => { toast.success(isCustomer ? 'Request sent' : 'Appointment booked'); list.reload(); }} defaultVehicle={defaultVehicle} isStaff={isStaff} />
      <BookingDialog open={Boolean(resched)} onClose={() => setResched(null)} appointment={resched} isStaff={isStaff} onDone={() => { toast.success('Appointment rescheduled'); list.reload(); }} />
      <FormDialog open={Boolean(reject)} onClose={() => setReject(null)} size="sm" title="Reject appointment" description="The customer will be notified with your reason." fields={[{ name: 'reason', label: 'Reason', type: 'textarea', required: true, span: 2 }]} submitLabel="Reject"
        onSubmit={async ({ reason }) => { await patch(`/appointments/${reject._id}/status`, { status: 'rejected', reason }); toast.success('Appointment rejected'); list.reload(); }} />
      <ConfirmDialog open={Boolean(cancel)} onClose={() => setCancel(null)} danger title="Cancel appointment?" message={cancel && `${formatDateTime(cancel.start)} — ${cancel.service?.name}`} confirmLabel="Cancel appointment" cancelLabel="Keep it"
        onConfirm={async () => { await act(() => post(`/appointments/${cancel._id}/cancel`, {}), 'Appointment cancelled'); setCancel(null); }} />
    </Page>
  );
}
