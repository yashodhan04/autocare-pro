import { Link } from 'react-router-dom';
import { BellRing, CheckCircle2 } from 'lucide-react';
import { Page } from '../components/common/Page.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate } from '../utils/format.js';

/** Maintenance reminders per vehicle: due soon / overdue by date or odometer. */
export default function RemindersPage() {
  const plans = useFetch('/maintenance-plans', { limit: 100 });
  const { role } = useAuth();
  const columns = [
    { key: 'title', header: 'Reminder', render: (p) => <div><p className="font-medium">{p.title}</p><p className="text-caption text-text-muted">{p.intervalDays ? `every ${p.intervalDays} days` : ''}{p.intervalDays && p.intervalKm ? ' / ' : ''}{p.intervalKm ? `every ${p.intervalKm.toLocaleString('en-IN')} km` : ''}</p></div> },
    { key: 'vehicle', header: 'Vehicle', render: (p) => <Link className="hover:underline" to={`/app/vehicles/${p.vehicle?._id}`}>{p.vehicle?.registrationNumber} <span className="text-text-muted">{p.vehicle?.make} {p.vehicle?.model}</span></Link> },
    { key: 'next', header: 'Next due', hideBelow: 'sm', render: (p) => <div>{p.nextDueDate && <p>{formatDate(p.nextDueDate)}</p>}{p.nextDueOdometer && <p className="text-caption text-text-muted">at {p.nextDueOdometer.toLocaleString('en-IN')} km</p>}</div> },
    { key: 'status', header: 'Status', render: (p) => p.dueReasons.length ? <div className="flex flex-col gap-1">{p.dueReasons.map((r) => <Badge key={r} variant={r.startsWith('overdue') || r.startsWith('odometer') ? 'danger' : 'warning'} size="sm">{r}</Badge>)}</div> : <span className="inline-flex items-center gap-1.5 text-caption text-success"><CheckCircle2 size={14} aria-hidden="true" />On track</span> },
  ];
  return (
    <Page title="Maintenance reminders" description={role === 'customer' ? 'Upcoming services for your vehicles, by date or kilometres.' : 'Date- and odometer-based service reminders. Add reminders from a vehicle page.'} badge={<BellRing size={18} className="text-text-muted" aria-hidden="true" />}>
      <DataTable columns={columns} rows={plans.data} loading={plans.loading} error={plans.error} onRetry={plans.reload} caption="Maintenance reminders"
        emptyTitle="No reminders set up" emptyMessage={role === 'customer' ? 'Your service advisor will set reminders after your first service.' : 'Open a vehicle and add a reminder with a day and/or kilometre interval.'} />
    </Page>
  );
}
