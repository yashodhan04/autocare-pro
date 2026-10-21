import { useEffect, useState } from 'react';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { FormField, Input, Select, Textarea } from '../../components/ui/Form.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useOptions } from '../../hooks/useOptions.js';
import { post, patch, parseError } from '../../services/api.js';
import { toDateInput, formatTime, formatMoney } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

/** Time-slot grid for a service + date, driven by the server's availability rules. */
function SlotPicker({ serviceId, date, value, onChange }) {
  const { data, loading, error } = useFetch(serviceId && date ? '/appointments/availability' : null, { service: serviceId, date });
  if (!serviceId || !date) return <p className="text-caption text-text-muted">Choose a service and date to see available times.</p>;
  if (loading) return <p className="text-caption text-text-muted" role="status">Checking availability…</p>;
  if (error) return <p className="text-caption text-danger" role="alert">{error}</p>;
  if (!data?.open) return <p className="text-caption text-warning-text" role="status">The workshop is closed on this day.</p>;
  if (!data.slots.some((s) => s.available)) return <p className="text-caption text-warning-text" role="status">No free slots on this day — try another date.</p>;
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Available times">
      {data.slots.map((s) => {
        const selected = value === s.start;
        return (
          <button key={s.start} type="button" role="radio" aria-checked={selected} disabled={!s.available} onClick={() => onChange(s.start)}
            className={cn('px-2 py-2 rounded-lg border text-body-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime',
              selected ? 'bg-brand-charcoal text-brand-lime border-brand-charcoal' : s.available ? 'bg-surface-card border-border hover:border-brand-charcoal' : 'bg-surface-muted text-text-disabled line-through cursor-not-allowed border-transparent')}>
            {formatTime(s.start)}
          </button>
        );
      })}
    </div>
  );
}

/**
 * BookingDialog — create an appointment, or (when `appointment` is given) reschedule one.
 * Availability is advisory; the server re-validates hours, bays and double-booking on submit.
 */
export function BookingDialog({ open, onClose, onDone, appointment, defaultVehicle, isStaff }) {
  const reschedule = Boolean(appointment);
  const { options: vehicles } = useOptions(open && !reschedule ? '/vehicles' : null, (v) => ({ value: v._id, label: `${v.registrationNumber} — ${v.make} ${v.model}${v.customer?.name ? ` (${v.customer.name})` : ''}`, type: v.vehicleType }));
  const { options: services } = useOptions(open && !reschedule ? '/services' : null, (s) => ({ value: s._id, label: `${s.name} · ${formatMoney(s.estimatedPrice)} · ${s.estimatedDurationMinutes} min` }));
  const [f, setF] = useState({ vehicle: '', service: '', date: '', start: '', issue: '' });
  const [err, setErr] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setF({ vehicle: defaultVehicle ?? '', service: appointment?.service?._id ?? '', date: '', start: '', issue: '' }); setErr(null); } }, [open, defaultVehicle, appointment]);

  const set = (k, v) => setF((s) => ({ ...s, [k]: v, ...(k === 'service' || k === 'date' ? { start: '' } : {}) }));

  async function submit(e) {
    e.preventDefault();
    if (!reschedule && (!f.vehicle || !f.service)) return setErr('Select a vehicle and a service');
    if (!f.start) return setErr('Pick a date and an available time');
    setSaving(true); setErr(null);
    try {
      if (reschedule) await patch(`/appointments/${appointment._id}/reschedule`, { start: f.start });
      else await post('/appointments', { vehicle: f.vehicle, service: f.service, start: f.start, issue: f.issue || undefined });
      onDone?.(); onClose();
    } catch (error) { setErr(parseError(error).message); } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onClose={onClose} size="lg" title={reschedule ? 'Reschedule appointment' : 'Book a service'}
      description={reschedule ? `${appointment.service?.name} · ${appointment.vehicle?.registrationNumber}` : isStaff ? 'Staff bookings are confirmed immediately.' : 'Your request will be confirmed by the workshop.'}>
      <form onSubmit={submit} noValidate className="space-y-4">
        {err && <div role="alert" className="rounded-lg border border-danger/30 bg-danger-light text-danger-text text-body-sm px-3 py-2.5">{err}</div>}
        {!reschedule && (
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Vehicle" htmlFor="bk-vehicle" required helper={vehicles.length === 0 ? 'Register a vehicle first' : undefined}>
              <Select id="bk-vehicle" value={f.vehicle} onChange={(e) => set('vehicle', e.target.value)}><option value="">Select vehicle…</option>{vehicles.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
            </FormField>
            <FormField label="Service" htmlFor="bk-service" required>
              <Select id="bk-service" value={f.service} onChange={(e) => set('service', e.target.value)}><option value="">Select service…</option>{services.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
            </FormField>
          </div>
        )}
        <FormField label="Date" htmlFor="bk-date" required>
          <Input id="bk-date" type="date" min={toDateInput()} value={f.date} onChange={(e) => set('date', e.target.value)} />
        </FormField>
        <div><p className="form-label">Time</p><SlotPicker serviceId={f.service} date={f.date} value={f.start} onChange={(s) => setF((x) => ({ ...x, start: s }))} /></div>
        {!reschedule && <FormField label="Describe the issue" htmlFor="bk-issue" helper="Optional — e.g. noise when braking"><Textarea id="bk-issue" rows={3} maxLength={1000} value={f.issue} onChange={(e) => set('issue', e.target.value)} /></FormField>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving}>{reschedule ? 'Reschedule' : isStaff ? 'Book & confirm' : 'Request appointment'}</Button>
        </div>
      </form>
    </Dialog>
  );
}
