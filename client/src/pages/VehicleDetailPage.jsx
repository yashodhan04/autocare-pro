import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Wrench, AlertTriangle, Trash2 } from 'lucide-react';
import { Page, DetailList } from '../components/common/Page.jsx';
import { LinkButton } from '../components/common/LinkButton.jsx';
import { FormDialog } from '../components/common/FormDialog.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { vehicleFields } from '../features/vehicles/vehicleFields.js';
import { SectionCard } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ConfirmDialog, EmptyState, ErrorState } from '../components/ui/States.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { del, patch, post, parseError } from '../services/api.js';
import { formatDate, formatMoney } from '../utils/format.js';

const planFields = [
  { name: 'title', label: 'Reminder', required: true, placeholder: 'Periodic service', span: 2 },
  { name: 'intervalDays', label: 'Every (days)', type: 'number', min: 1, helper: 'Leave empty for odometer-only' },
  { name: 'intervalKm', label: 'Every (km)', type: 'number', min: 1, helper: 'Leave empty for date-only' },
  { name: 'lastServiceDate', label: 'Last done on', type: 'date' },
  { name: 'lastServiceOdometer', label: 'Odometer at last service', type: 'number', min: 0 },
  { name: 'notes', label: 'Notes', span: 2 },
];

export default function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { role, hasRole } = useAuth();
  const isCustomer = role === 'customer';
  const canWrite = isCustomer || hasRole('super_admin', 'workshop_admin', 'service_advisor');
  const canPlan = hasRole('super_admin', 'workshop_admin', 'service_advisor');
  const res = useFetch(`/vehicles/${id}/history`);
  const [edit, setEdit] = useState(false);
  const [plan, setPlan] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);

  if (res.loading && !res.data) return <Page><Skeleton className="h-8 w-60" /><Skeleton className="h-48 w-full" /></Page>;
  if (res.error) return <Page><ErrorState title="Vehicle not found" message={res.error} action={<Button size="sm" variant="outline" onClick={() => navigate('/app/vehicles')}>Back to vehicles</Button>} /></Page>;
  const { vehicle: v, history, plans, recommendations } = res.data;

  async function remove() {
    try { await del(`/vehicles/${id}`); toast.success('Vehicle removed'); navigate('/app/vehicles'); } catch (e) { toast.error('Cannot remove vehicle', parseError(e).message); setConfirmDel(false); }
  }

  return (
    <Page title={`${v.make} ${v.model}`} description={`${v.registrationNumber} · ${v.year} · ${v.fuelType}`}
      actions={<>
        <LinkButton to="/app/vehicles" variant="outline" size="sm" icon={<ArrowLeft size={15} />}>Vehicles</LinkButton>
        {canWrite && <Button variant="outline" size="sm" icon={<Pencil size={15} />} onClick={() => setEdit(true)}>Edit</Button>}
        {canWrite && <Button variant="outline" size="sm" icon={<Trash2 size={15} />} onClick={() => setConfirmDel(true)}>Remove</Button>}
        {isCustomer && <LinkButton to={`/app/appointments?book=${id}`} size="sm" icon={<Wrench size={15} />}>Book service</LinkButton>}
      </>}>
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Details" className="lg:col-span-1">
          <DetailList columns={2} items={[['Owner', v.customer?.name], ['Type', v.vehicleType], ['Colour', v.color], ['Odometer', `${v.odometer.toLocaleString('en-IN')} km`], ['VIN', <span className="font-mono text-caption">{v.vin ?? '—'}</span>]]} />
        </SectionCard>

        <SectionCard title="Maintenance reminders" className="lg:col-span-2" noPadding action={canPlan && <Button size="sm" variant="outline" icon={<Plus size={14} />} onClick={() => setPlan({})}>Add reminder</Button>}>
          {plans.length === 0 ? <EmptyState compact title="No reminders set" message="Reminders alert the customer when a service is due by date or kilometres." /> : (
            <ul className="divide-y divide-border">
              {plans.map((p) => (
                <li key={p._id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div><p className="font-medium text-body-sm">{p.title}</p>
                    <p className="text-caption text-text-muted">{p.nextDueDate ? `Due ${formatDate(p.nextDueDate)}` : ''}{p.nextDueDate && p.nextDueOdometer ? ' or ' : ''}{p.nextDueOdometer ? `at ${p.nextDueOdometer.toLocaleString('en-IN')} km` : ''}</p></div>
                  {canPlan && <Button variant="ghost" size="sm" iconOnly aria-label={`Delete reminder ${p.title}`} icon={<Trash2 size={14} />} onClick={async () => { await del(`/maintenance-plans/${p._id}`); res.reload(); }} />}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {recommendations.length > 0 && (
        <SectionCard title="Maintenance recommendations" subtitle="From the most recent inspection">
          <ul className="space-y-2">{recommendations.map((r, i) => (
            <li key={i} className="flex items-start gap-2.5 text-body-sm"><AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" aria-hidden="true" /><span className="flex-1">{r.description}</span><Badge variant={r.severity === 'high' ? 'danger' : r.severity === 'medium' ? 'warning' : 'neutral'} size="sm">{r.severity}</Badge></li>
          ))}</ul>
        </SectionCard>
      )}

      <section aria-labelledby="history-h">
        <h2 id="history-h" className="text-h4 font-semibold mb-3">Service history</h2>
        {history.length === 0 ? <div className="card"><EmptyState title="No completed services yet" message="Completed jobs, parts replaced and invoices will be listed here." /></div> : (
          <ol className="space-y-3">
            {history.map((h) => (
              <li key={h.jobId} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="font-semibold text-text-primary">{h.services.join(', ') || h.problem}</p>
                    <p className="text-caption text-text-muted"><time dateTime={h.date}>{formatDate(h.date)}</time> · {h.odometer.toLocaleString('en-IN')} km · <span className="font-mono">{h.jobNo}</span></p></div>
                  {h.invoice && <button type="button" className="text-right" onClick={() => navigate(`/app/invoices/${h.invoice._id ?? ''}`)}><span className="block text-body-sm font-semibold">{formatMoney(h.invoice.total)}</span><StatusBadge status={h.invoice.status} /></button>}
                </div>
                {h.work.length > 0 && <p className="mt-3 text-body-sm text-text-secondary"><span className="font-medium text-text-primary">Work performed:</span> {h.work.join(' · ')}</p>}
                {h.partsReplaced.length > 0 && <p className="mt-1 text-body-sm text-text-secondary"><span className="font-medium text-text-primary">Parts replaced:</span> {h.partsReplaced.map((p) => `${p.quantity}× ${p.name}`).join(', ')}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>

      <FormDialog open={edit} onClose={() => setEdit(false)} size="lg" title="Edit vehicle" fields={vehicleFields({ editing: true })} initial={v} submitLabel="Save changes"
        onSubmit={async (b) => { await patch(`/vehicles/${id}`, b); toast.success('Vehicle updated'); res.reload(); }} />
      <FormDialog open={Boolean(plan)} onClose={() => setPlan(null)} title="Add maintenance reminder" fields={planFields} initial={{}} submitLabel="Save reminder"
        onSubmit={async (b) => { await post('/maintenance-plans', { ...b, vehicle: id }); toast.success('Reminder saved'); res.reload(); }} />
      <ConfirmDialog open={confirmDel} onClose={() => setConfirmDel(false)} onConfirm={remove} danger title="Remove vehicle?" message="The vehicle is hidden from lists but its service history is kept." confirmLabel="Remove" />
    </Page>
  );
}
