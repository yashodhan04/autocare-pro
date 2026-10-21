import { Link } from 'react-router-dom';
import { Users, Car, CalendarDays, ClipboardList, FileText, PackageX, Wallet, Receipt, BellRing, TrendingUp, Plus, ArrowRight, Clock, Wrench } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import { Page } from '../components/common/Page.jsx';
import { LinkButton } from '../components/common/LinkButton.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { MetricCard, SectionCard } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState, ErrorState } from '../components/ui/States.jsx';
import { SkeletonCard, Skeleton } from '../components/ui/Skeleton.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDateTime, formatMoney, humanize } from '../utils/format.js';

const Stat = ({ to, ...p }) => <Link to={to} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime rounded-2xl"><MetricCard {...p} /></Link>;

function AppointmentList({ items, showCustomer }) {
  if (!items?.length) return <EmptyState compact title="No upcoming appointments" message="Booked appointments will show up here." />;
  return (
    <ul className="divide-y divide-border -my-2">{items.map((a) => (
      <li key={a._id} className="py-3 flex items-center justify-between gap-3">
        <div className="min-w-0"><p className="text-body-sm font-medium truncate">{a.service?.name} · {a.vehicle?.registrationNumber}</p><p className="text-caption text-text-muted">{formatDateTime(a.start)}{showCustomer && a.customer?.name ? ` · ${a.customer.name}` : ''}</p></div>
        <StatusBadge status={a.status} />
      </li>))}</ul>
  );
}

function RevenueChart({ series }) {
  const has = series.some((d) => d.revenue > 0);
  if (!has) return <EmptyState compact icon={<TrendingUp size={22} />} title="No payments in the last 14 days" message="Revenue appears here as payments are recorded." />;
  return (
    <div className="h-56" role="img" aria-label="Revenue for the last 14 days">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
          <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C8F135" stopOpacity={0.7} /><stop offset="100%" stopColor="#C8F135" stopOpacity={0.05} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E3E6ED" vertical={false} />
          <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11, fill: '#8B93A5' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#8B93A5' }} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
          <RTooltip formatter={(v) => [formatMoney(v), 'Revenue']} labelFormatter={(d) => d} />
          <Area type="monotone" dataKey="revenue" stroke="#18191F" strokeWidth={2} fill="url(#rev)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function StaffDashboard({ d }) {
  const s = d.stats;
  return (
    <>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat to="/app/customers" label="Customers" value={s.customers} icon={<Users size={18} />} />
        <Stat to="/app/vehicles" label="Vehicles" value={s.vehicles} icon={<Car size={18} />} />
        <Stat to="/app/appointments" label="Today's appointments" value={s.todayAppointments} icon={<CalendarDays size={18} />} />
        <Stat to="/app/service-jobs" label="Active jobs" value={s.activeJobs} icon={<ClipboardList size={18} />} />
        <Stat to="/app/estimates" label="Pending approvals" value={s.pendingEstimates} icon={<FileText size={18} />} />
        <Stat to="/app/inventory" label="Inventory alerts" value={s.inventoryAlerts} icon={<PackageX size={18} />} iconColor={s.inventoryAlerts ? 'bg-warning-muted' : 'bg-brand-lime-muted'} />
      </div>

      {d.revenue && (
        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard title="Revenue — last 14 days" subtitle="Payments received" className="lg:col-span-2"><RevenueChart series={d.revenue.series} /></SectionCard>
          <div className="grid gap-4 content-start">
            <MetricCard label="Revenue today" value={formatMoney(d.revenue.today)} icon={<Wallet size={18} />} />
            <MetricCard label="Revenue this month" value={formatMoney(d.revenue.month)} icon={<TrendingUp size={18} />} />
            <MetricCard label="Outstanding balance" value={formatMoney(d.revenue.outstanding)} icon={<Receipt size={18} />} iconColor="bg-warning-muted" />
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Upcoming appointments" action={<Link to="/app/appointments" className="text-caption font-medium text-text-secondary hover:text-text-primary inline-flex items-center gap-1">View all <ArrowRight size={13} aria-hidden="true" /></Link>}><AppointmentList items={d.upcomingAppointments} showCustomer /></SectionCard>
        <SectionCard title="Recent service activity" subtitle="Latest job status changes">
          {d.recentActivity.length === 0 ? <EmptyState compact title="No activity yet" message="Job check-ins and status changes will appear here." /> : (
            <ol className="space-y-3">{d.recentActivity.map((a, i) => (
              <li key={i} className="flex gap-3"><span className="w-2 h-2 rounded-full bg-brand-lime border border-brand-charcoal/40 mt-2 shrink-0" aria-hidden="true" />
                <div className="min-w-0"><p className="text-body-sm"><span className="font-mono font-semibold">{a.jobNo}</span> {a.vehicle && <span className="text-text-muted">({a.vehicle})</span>} → {humanize(a.to)}</p><p className="text-caption text-text-muted">{formatDateTime(a.at)}{a.note ? ` · ${a.note}` : ''}</p></div></li>))}</ol>)}
        </SectionCard>
      </div>
    </>
  );
}

function CustomerDashboard({ d }) {
  const s = d.stats;
  return (
    <>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat to="/app/vehicles" label="My vehicles" value={s.vehicles} icon={<Car size={18} />} />
        <Stat to="/app/appointments" label="Upcoming bookings" value={s.upcomingAppointments} icon={<CalendarDays size={18} />} />
        <Stat to="/app/estimates" label="Awaiting my approval" value={s.pendingEstimates} icon={<FileText size={18} />} iconColor={s.pendingEstimates ? 'bg-warning-muted' : 'bg-brand-lime-muted'} />
        <Stat to="/app/invoices" label="Outstanding balance" value={formatMoney(s.outstandingBalance)} icon={<Receipt size={18} />} />
      </div>
      {s.pendingEstimates > 0 && <div className="rounded-2xl border-2 border-brand-lime bg-brand-lime-muted/40 p-4 flex flex-wrap items-center justify-between gap-3" role="status"><p className="font-medium">You have {s.pendingEstimates} estimate{s.pendingEstimates > 1 ? 's' : ''} waiting for your approval.</p><LinkButton to="/app/estimates" size="sm">Review now</LinkButton></div>}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Upcoming appointments" action={<LinkButton to="/app/appointments" size="sm" variant="outline" icon={<Plus size={14} />}>Book</LinkButton>}><AppointmentList items={d.upcomingAppointments} /></SectionCard>
        <SectionCard title="Vehicles in the workshop">
          {d.activeJobs.length === 0 ? <EmptyState compact icon={<Wrench size={22} />} title="Nothing in service" message="Active repair jobs appear here with live status." /> : (
            <ul className="divide-y divide-border -my-2">{d.activeJobs.map((j) => <li key={j._id}><Link to={`/app/service-jobs/${j._id}`} className="py-3 flex items-center justify-between gap-3"><div><p className="text-body-sm font-medium">{j.vehicle?.make} {j.vehicle?.model} · {j.vehicle?.registrationNumber}</p><p className="text-caption text-text-muted font-mono">{j.jobNo}</p></div><StatusBadge status={j.status} /></Link></li>)}</ul>)}
        </SectionCard>
      </div>
      <SectionCard title="Maintenance reminders" action={<Link to="/app/reminders" className="text-caption font-medium text-text-secondary hover:text-text-primary">All reminders</Link>}>
        {d.reminders.length === 0 ? <EmptyState compact icon={<BellRing size={22} />} title="Nothing due" message="You're up to date. We'll remind you when a service is coming up." /> : (
          <ul className="space-y-2">{d.reminders.map((r) => <li key={r._id} className="flex flex-wrap items-center justify-between gap-2 text-body-sm"><span>{r.title} — {r.vehicle?.registrationNumber}</span><span className="flex gap-1.5">{r.dueReasons.map((x) => <Badge key={x} variant="warning" size="sm">{x}</Badge>)}</span></li>)}</ul>)}
      </SectionCard>
    </>
  );
}

function MechanicDashboard({ d }) {
  const s = d.stats;
  return (
    <>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat to="/app/workspace" label="Assigned jobs" value={s.assignedJobs} icon={<ClipboardList size={18} />} />
        <Stat to="/app/workspace" label="In progress" value={s.inProgress} icon={<Wrench size={18} />} />
        <Stat to="/app/workspace" label="At quality check" value={s.awaitingQuality} icon={<Clock size={18} />} />
        <Stat to="/app/workspace" label="Parts pending" value={s.pendingParts} icon={<PackageX size={18} />} />
      </div>
      <SectionCard title="My active jobs" action={<LinkButton to="/app/workspace" size="sm" variant="outline">Open workspace</LinkButton>}>
        {d.activeJobs.length === 0 ? <EmptyState compact title="No jobs assigned" message="New assignments appear here." /> : (
          <ul className="divide-y divide-border -my-2">{d.activeJobs.map((j) => <li key={j._id}><Link to={`/app/service-jobs/${j._id}`} className="py-3 flex items-center justify-between gap-3"><div><p className="text-body-sm font-medium">{j.vehicle?.make} {j.vehicle?.model} · {j.vehicle?.registrationNumber}</p><p className="text-caption text-text-muted line-clamp-1">{j.jobNo} · {j.reportedProblem}</p></div><StatusBadge status={j.status} /></Link></li>)}</ul>)}
      </SectionCard>
    </>
  );
}

export default function DashboardPage() {
  const { user, role, hasRole } = useAuth();
  const res = useFetch('/reports/dashboard');
  const d = res.data;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const canAdd = hasRole('super_admin', 'workshop_admin', 'service_advisor');

  return (
    <Page title={`${greeting}, ${user.name.split(' ')[0]}`} description={role === 'customer' ? 'Your vehicles, bookings and service status.' : 'Live overview of workshop operations.'}
      actions={canAdd ? <><LinkButton to="/app/appointments" variant="outline" size="sm" icon={<CalendarDays size={15} />}>New booking</LinkButton><LinkButton to="/app/service-jobs" size="sm" icon={<Plus size={15} />}>New job card</LinkButton></> : role === 'customer' ? <LinkButton to="/app/appointments" size="sm" icon={<Plus size={15} />}>Book a service</LinkButton> : null}>
      {res.error && <ErrorState title="Couldn't load the dashboard" message={res.error} action={<Button size="sm" variant="outline" onClick={res.reload}>Try again</Button>} />}
      {res.loading && !d && <><div className="grid gap-4 grid-cols-2 lg:grid-cols-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div><Skeleton className="h-64 w-full" /></>}
      {d?.kind === 'staff' && <StaffDashboard d={d} />}
      {d?.kind === 'customer' && <CustomerDashboard d={d} />}
      {d?.kind === 'mechanic' && <MechanicDashboard d={d} />}
    </Page>
  );
}
