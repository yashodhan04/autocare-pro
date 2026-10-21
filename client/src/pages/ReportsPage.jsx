import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import { Page } from '../components/common/Page.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { MetricCard, SectionCard } from '../components/ui/Card.jsx';
import { Input, FormField } from '../components/ui/Form.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { EmptyState, ErrorState } from '../components/ui/States.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMoney, humanize, toDateInput } from '../utils/format.js';

const LIME = '#C8F135', INK = '#18191F', GREY = '#8B93A5';
const AXIS = { tick: { fontSize: 11, fill: GREY }, tickLine: false, axisLine: false };
const shortDate = (d) => d.slice(5);

function Chart({ data, children, empty, ariaLabel, height = 260 }) {
  if (!data?.length) return <EmptyState compact title={empty ?? 'No data in this range'} message="Try widening the date range." />;
  return <div className="w-full" style={{ height }} role="img" aria-label={ariaLabel}><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}

const hasAny = (series, ...keys) => series?.some((r) => keys.some((k) => r[k] > 0));

/** Each tab fetches its own report for the selected date range. */
function Report({ id, range }) {
  const params = ['low-stock', 'pending-jobs'].includes(id) ? undefined : range;
  const res = useFetch(`/reports/${id}`, params);
  const d = res.data;
  if (res.loading && !d) return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (res.error) return <ErrorState title="Couldn't load this report" message={res.error} action={<Button size="sm" variant="outline" onClick={res.reload}>Retry</Button>} />;

  switch (id) {
    case 'revenue': return (<>
      <div className="grid gap-4 sm:grid-cols-2"><MetricCard label="Revenue in range" value={formatMoney(d.total)} /><MetricCard label="Payments recorded" value={d.payments} /></div>
      <SectionCard title="Daily revenue"><Chart data={hasAny(d.series, 'revenue') ? d.series : []} empty="No payments in this range" ariaLabel="Daily revenue">
        <AreaChart data={d.series}><CartesianGrid stroke="#E3E6ED" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tickFormatter={shortDate} {...AXIS} /><YAxis {...AXIS} width={52} /><RTooltip formatter={(v) => formatMoney(v)} /><Area dataKey="revenue" name="Revenue" stroke={INK} strokeWidth={2} fill={LIME} fillOpacity={0.45} /></AreaChart></Chart></SectionCard>
      <SectionCard title="By payment method" noPadding><DataTable rows={d.byMethod} rowKey="method" columns={[{ key: 'method', header: 'Method', render: (m) => humanize(m.method) }, { key: 'count', header: 'Payments', align: 'right' }, { key: 'amount', header: 'Amount', align: 'right', render: (m) => formatMoney(m.amount) }]} emptyTitle="No payments" /></SectionCard></>);
    case 'services': return (<>
      <MetricCard label="Services completed" value={d.total} />
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Completed per day"><Chart data={hasAny(d.series, 'completed') ? d.series : []} ariaLabel="Completed jobs per day"><BarChart data={d.series}><CartesianGrid stroke="#E3E6ED" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tickFormatter={shortDate} {...AXIS} /><YAxis allowDecimals={false} {...AXIS} width={30} /><RTooltip /><Bar dataKey="completed" name="Completed" fill={INK} radius={[4, 4, 0, 0]} /></BarChart></Chart></SectionCard>
        <SectionCard title="Most requested services" noPadding><DataTable rows={d.topServices} rowKey="_id" columns={[{ key: 'name', header: 'Service' }, { key: 'count', header: 'Jobs', align: 'right' }]} emptyTitle="No completed jobs" /></SectionCard>
      </div></>);
    case 'pending-jobs': return (<div className="grid gap-6 lg:grid-cols-2">
      <SectionCard title="Open jobs by status"><Chart data={d.byStatus} empty="No open jobs" ariaLabel="Open jobs by status"><BarChart data={d.byStatus.map((s) => ({ ...s, label: humanize(s.status) }))} layout="vertical" margin={{ left: 40 }}><CartesianGrid stroke="#E3E6ED" strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} {...AXIS} /><YAxis type="category" dataKey="label" {...AXIS} width={120} /><RTooltip /><Bar dataKey="count" name="Jobs" fill={INK} radius={[0, 4, 4, 0]} /></BarChart></Chart></SectionCard>
      <SectionCard title="Longest-open jobs" noPadding><DataTable rows={d.oldest} columns={[{ key: 'jobNo', header: 'Job', className: 'font-mono text-caption' }, { key: 'vehicle', header: 'Vehicle', render: (j) => j.vehicle?.registrationNumber }, { key: 'mechanic', header: 'Mechanic', hideBelow: 'sm', render: (j) => j.assignedMechanic?.name ?? '—' }, { key: 'status', header: 'Status', render: (j) => <StatusBadge status={j.status} /> }]} emptyTitle="No open jobs" /></SectionCard></div>);
    case 'appointments': return (<>
      <MetricCard label="Appointments in range" value={d.total} />
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Bookings per day" className="lg:col-span-2"><Chart data={hasAny(d.series, 'appointments') ? d.series : []} ariaLabel="Appointments per day"><BarChart data={d.series}><CartesianGrid stroke="#E3E6ED" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tickFormatter={shortDate} {...AXIS} /><YAxis allowDecimals={false} {...AXIS} width={30} /><RTooltip /><Bar dataKey="appointments" name="Appointments" fill={INK} radius={[4, 4, 0, 0]} /></BarChart></Chart></SectionCard>
        <SectionCard title="By status" noPadding><DataTable rows={d.byStatus} rowKey="status" columns={[{ key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> }, { key: 'count', header: 'Count', align: 'right' }]} emptyTitle="None" /></SectionCard>
      </div></>);
    case 'inventory-movement': return (<>
      <SectionCard title="Stock in vs. stock out"><Chart data={hasAny(d.series, 'stockIn', 'stockOut') ? d.series : []} ariaLabel="Stock movement per day"><BarChart data={d.series}><CartesianGrid stroke="#E3E6ED" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tickFormatter={shortDate} {...AXIS} /><YAxis allowDecimals={false} {...AXIS} width={30} /><RTooltip /><Legend /><Bar dataKey="stockIn" name="Stock in" fill={LIME} stroke={INK} radius={[4, 4, 0, 0]} /><Bar dataKey="stockOut" name="Stock out" fill={INK} radius={[4, 4, 0, 0]} /></BarChart></Chart></SectionCard>
      <SectionCard title="Most-used parts" noPadding><DataTable rows={d.topItems} columns={[{ key: 'name', header: 'Part' }, { key: 'sku', header: 'SKU', className: 'font-mono text-caption' }, { key: 'used', header: 'Units out', align: 'right' }]} emptyTitle="No stock-outs in this range" /></SectionCard></>);
    case 'low-stock': return (<SectionCard title="Parts at or below reorder level" noPadding><DataTable rows={d} columns={[{ key: 'name', header: 'Part', render: (i) => <div><p className="font-medium">{i.name}</p><p className="text-caption font-mono text-text-muted">{i.sku}</p></div> }, { key: 'supplier', header: 'Supplier', hideBelow: 'sm', render: (i) => i.supplier?.name ?? '—' }, { key: 'quantity', header: 'In stock', align: 'right' }, { key: 'reorderLevel', header: 'Reorder at', align: 'right' }, { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.stockStatus} /> }]} emptyTitle="Nothing is running low" emptyMessage="All parts are above their reorder level." /></SectionCard>);
    case 'mechanic-workload': return (<SectionCard title="Mechanic workload" subtitle="Open jobs now; completed jobs and hours in the selected range" noPadding><DataTable rows={d.mechanics} columns={[{ key: 'name', header: 'Mechanic' }, { key: 'openJobs', header: 'Open jobs', align: 'right' }, { key: 'completedJobs', header: 'Completed', align: 'right' }, { key: 'hoursLogged', header: 'Hours logged', align: 'right' }]} emptyTitle="No mechanics" /></SectionCard>);
    case 'customer-activity': return (<>
      <div className="grid gap-4 sm:grid-cols-2"><MetricCard label="New customers in range" value={d.newCustomers} /><MetricCard label="Average rating" value={d.rating.count ? `${d.rating.average} / 5 (${d.rating.count})` : 'No reviews yet'} /></div>
      <SectionCard title="Top customers by billing" noPadding><DataTable rows={d.topCustomers} columns={[{ key: 'name', header: 'Customer' }, { key: 'invoices', header: 'Invoices', align: 'right' }, { key: 'spend', header: 'Billed', align: 'right', render: (c) => formatMoney(c.spend) }]} emptyTitle="No invoices in this range" /></SectionCard></>);
    default: return null;
  }
}

const ALL = [
  { id: 'revenue', label: 'Revenue', roles: ['super_admin', 'workshop_admin', 'cashier'] },
  { id: 'services', label: 'Completed services', roles: ['super_admin', 'workshop_admin', 'service_advisor'] },
  { id: 'pending-jobs', label: 'Pending jobs', roles: ['super_admin', 'workshop_admin', 'service_advisor'] },
  { id: 'appointments', label: 'Appointments', roles: ['super_admin', 'workshop_admin', 'service_advisor'] },
  { id: 'inventory-movement', label: 'Inventory movement', roles: ['super_admin', 'workshop_admin', 'inventory_manager'] },
  { id: 'low-stock', label: 'Low stock', roles: ['super_admin', 'workshop_admin', 'inventory_manager', 'service_advisor'] },
  { id: 'mechanic-workload', label: 'Mechanic workload', roles: ['super_admin', 'workshop_admin'] },
  { id: 'customer-activity', label: 'Customers', roles: ['super_admin', 'workshop_admin'] },
];
const PRESETS = [[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days']];

export default function ReportsPage() {
  const { role } = useAuth();
  const tabs = ALL.filter((t) => t.roles.includes(role));
  const [tab, setTab] = useState(tabs[0]?.id);
  const [from, setFrom] = useState(toDateInput(new Date(Date.now() - 29 * 86_400_000)));
  const [to, setTo] = useState(toDateInput());
  const range = useMemo(() => ({ from, to }), [from, to]);
  const rangeless = ['low-stock', 'pending-jobs'].includes(tab);
  const invalid = from > to;
  const preset = (days) => { setTo(toDateInput()); setFrom(toDateInput(new Date(Date.now() - (days - 1) * 86_400_000))); };

  return (
    <Page title="Reports & analytics" description="All charts and tables are calculated from live workshop data.">
      <Tabs tabs={tabs.map((t) => ({ id: t.id, label: t.label }))} active={tab} onChange={setTab} />
      {!rangeless && (
        <div className="card p-4 flex flex-wrap items-end gap-4">
          <FormField label="From" htmlFor="r-from"><Input id="r-from" type="date" max={to} value={from} onChange={(e) => setFrom(e.target.value)} /></FormField>
          <FormField label="To" htmlFor="r-to"><Input id="r-to" type="date" min={from} max={toDateInput()} value={to} onChange={(e) => setTo(e.target.value)} /></FormField>
          <div className="flex gap-2 flex-wrap">{PRESETS.map(([d, label]) => <Button key={d} size="sm" variant="outline" onClick={() => preset(d)}>{label}</Button>)}</div>
          {invalid && <p role="alert" className="text-caption text-danger">“From” must be before “To”.</p>}
        </div>
      )}
      <div className="space-y-6" key={`${tab}`}>{invalid && !rangeless ? null : <Report id={tab} range={range} />}</div>
    </Page>
  );
}
