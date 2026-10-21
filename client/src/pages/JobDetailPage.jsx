import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Play, SearchCheck, FileText, ShieldCheck, ShieldX, Receipt, CreditCard, Truck, Ban, Pencil, Send } from 'lucide-react';
import { Page, DetailList } from '../components/common/Page.jsx';
import { LinkButton } from '../components/common/LinkButton.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { FormDialog } from '../components/common/FormDialog.jsx';
import { InspectionFormDialog } from '../features/jobs/InspectionFormDialog.jsx';
import { InspectionSummary } from '../features/jobs/InspectionView.jsx';
import { JobWorkPanel } from '../features/jobs/JobWorkPanel.jsx';
import { PaymentDialog } from '../features/jobs/PaymentDialog.jsx';
import { SectionCard } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ConfirmDialog, EmptyState, ErrorState } from '../components/ui/States.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { PRIORITY_OPTIONS } from '../config/options.js';
import { useFetch } from '../hooks/useFetch.js';
import { useOptions } from '../hooks/useOptions.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { patch, post, parseError } from '../services/api.js';
import { cn } from '../utils/cn.js';
import { formatDate, formatDateTime, formatMoney, humanize, toDateInput } from '../utils/format.js';

const PIPELINE = ['checked_in', 'inspection', 'awaiting_estimate', 'awaiting_approval', 'approved', 'in_progress', 'quality_check', 'completed', 'invoiced', 'delivered'];

function Pipeline({ status }) {
  if (status === 'cancelled') return <Badge variant="neutral" size="md">This job was cancelled</Badge>;
  const at = PIPELINE.indexOf(status);
  return (
    <ol className="flex gap-1 overflow-x-auto pb-1" aria-label="Job progress">
      {PIPELINE.map((s, i) => (
        <li key={s} aria-current={i === at ? 'step' : undefined} className={cn('flex-1 min-w-[5.5rem] rounded-lg px-2 py-1.5 text-center text-[11px] font-medium leading-tight border',
          i < at ? 'bg-brand-charcoal text-white border-brand-charcoal' : i === at ? 'bg-brand-lime text-brand-charcoal border-brand-lime' : 'bg-surface-card text-text-muted border-border')}>{humanize(s)}</li>
      ))}
    </ol>
  );
}

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, role, hasRole } = useAuth();
  const isCustomer = role === 'customer';
  const isAdvisor = hasRole('super_admin', 'workshop_admin', 'service_advisor');
  const isAdmin = hasRole('super_admin', 'workshop_admin');
  const canBill = isAdvisor || role === 'cashier';
  const canPay = isAdmin || role === 'cashier';

  const jobRes = useFetch(`/jobs/${id}`);
  const job = jobRes.data;
  const estimates = useFetch(job ? '/estimates' : null, { job: id, limit: 50 });
  const inspections = useFetch(job ? '/inspections' : null, { job: id, limit: 20 });
  const invoiceRes = useFetch(job && ['invoiced', 'delivered'].includes(job.status) && role !== 'mechanic' && role !== 'inventory_manager' ? '/invoices' : null, { job: id });
  const invoice = invoiceRes.data?.[0];
  const { options: mechanics } = useOptions(isAdvisor ? '/users/staff' : null, (m) => ({ value: m._id, label: m.name }), {});

  const [qs] = useSearchParams();
  const [tab, setTab] = useState(qs.get('tab') ?? 'overview');
  const [inspOpen, setInspOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [qc, setQc] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [pay, setPay] = useState(false);
  const [busy, setBusy] = useState(false);

  if (jobRes.loading && !job) return <Page><Skeleton className="h-8 w-72" /><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></Page>;
  if (jobRes.error) return <Page><ErrorState title="Job not found" message={jobRes.error} action={<Button size="sm" variant="outline" onClick={() => navigate('/app/service-jobs')}>Back to jobs</Button>} /></Page>;

  const isAssigned = String(job.assignedMechanic?._id) === String(user._id);
  const canWork = isAdvisor || (role === 'mechanic' && isAssigned);
  const reload = () => { jobRes.reload(); estimates.reload(); inspections.reload(); invoiceRes.reload(); };
  const run = async (fn, ok) => { setBusy(true); try { const r = await fn(); toast.success(ok); reload(); return r; } catch (e) { toast.error('Action failed', parseError(e).message); } finally { setBusy(false); setConfirm(null); } };
  const go = (to, ok, note) => run(() => post(`/jobs/${id}/transition`, { to, note }), ok);

  const s = job.status;
  const latestEst = estimates.data?.[0];
  const actions = [];
  if (!isCustomer) {
    if (canWork && s === 'checked_in') actions.push(<Button key="si" variant="outline" size="sm" icon={<SearchCheck size={15} />} loading={busy} onClick={() => go('inspection', 'Inspection started')}>Start inspection</Button>);
    if (canWork && ['checked_in', 'inspection'].includes(s)) actions.push(<Button key="ri" size="sm" icon={<SearchCheck size={15} />} onClick={() => setInspOpen(true)}>Record inspection</Button>);
    if (isAdvisor && s === 'awaiting_estimate') actions.push(<LinkButton key="pe" to={`/app/estimates/new?job=${id}`} size="sm" icon={<FileText size={15} />}>Prepare estimate</LinkButton>);
    if (isAdvisor && s === 'awaiting_approval' && latestEst) actions.push(<LinkButton key="ve" to={`/app/estimates/${latestEst._id}`} size="sm" variant="outline" icon={<FileText size={15} />}>View estimate</LinkButton>);
    if (canWork && s === 'approved') actions.push(<Button key="sw" size="sm" icon={<Play size={15} />} loading={busy} onClick={() => go('in_progress', 'Work started')}>Start work</Button>);
    if (canWork && s === 'in_progress') actions.push(<Button key="qc" size="sm" icon={<Send size={15} />} loading={busy} onClick={() => go('quality_check', 'Submitted for quality check')}>Submit for quality check</Button>);
    if (isAdvisor && s === 'quality_check') actions.push(<Button key="qcp" size="sm" icon={<ShieldCheck size={15} />} onClick={() => setQc(true)}>Review quality check</Button>);
    if (canBill && s === 'completed') actions.push(<Button key="inv" size="sm" icon={<Receipt size={15} />} loading={busy} onClick={() => run(() => post('/invoices', { job: id }), 'Invoice generated')}>Generate invoice</Button>);
    if (canPay && s === 'invoiced' && invoice && invoice.balance > 0) actions.push(<Button key="pay" size="sm" icon={<CreditCard size={15} />} onClick={() => setPay(true)}>Record payment</Button>);
    if ((isAdvisor || role === 'cashier') && s === 'invoiced' && invoice?.status === 'paid') actions.push(<Button key="dl" size="sm" icon={<Truck size={15} />} loading={busy} onClick={() => go('delivered', 'Vehicle delivered')}>Mark delivered</Button>);
    if (isAdvisor && !['delivered', 'cancelled', 'invoiced'].includes(s) && (isAdmin || ['checked_in', 'inspection', 'awaiting_estimate', 'awaiting_approval', 'approved'].includes(s))) actions.push(<Button key="cx" size="sm" variant="ghost" icon={<Ban size={15} />} onClick={() => setConfirm('cancel')}>Cancel job</Button>);
  } else {
    const pending = (estimates.data ?? []).find((e) => e.status === 'pending_approval');
    if (pending) actions.push(<LinkButton key="rv" to={`/app/estimates/${pending._id}`} size="sm" icon={<FileText size={15} />}>Review &amp; approve estimate</LinkButton>);
    if (invoice) actions.push(<LinkButton key="iv" to={`/app/invoices/${invoice._id}`} size="sm" variant="outline" icon={<Receipt size={15} />}>View invoice</LinkButton>);
  }

  const tabs = [
    { id: 'overview', label: 'Overview' }, { id: 'inspection', label: `Inspection${inspections.data?.length ? ` (${inspections.data.length})` : ''}` },
    { id: 'estimate', label: `Estimates${estimates.data?.length ? ` (${estimates.data.length})` : ''}` },
    ...(!isCustomer ? [{ id: 'work', label: 'Work' }] : []), { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <Page title={<span className="font-mono">{job.jobNo}</span>} badge={<><StatusBadge status={s} size="md" /><StatusBadge status={job.priority} size="md" /></>}
      description={`${job.vehicle?.make} ${job.vehicle?.model} · ${job.vehicle?.registrationNumber} — ${job.customer?.name}`}
      actions={<><LinkButton to="/app/service-jobs" variant="outline" size="sm" icon={<ArrowLeft size={15} />}>All jobs</LinkButton>{isAdvisor && !['delivered', 'cancelled'].includes(s) && <Button variant="outline" size="sm" icon={<Pencil size={15} />} onClick={() => setEdit(true)}>Edit</Button>}</>}>
      <Pipeline status={s} />
      {actions.length > 0 && <div className="card p-4 flex flex-wrap items-center gap-2" role="region" aria-label="Next steps"><span className="text-caption font-semibold uppercase tracking-wide text-text-muted mr-2">Next step</span>{actions}</div>}

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard title="Job details" className="lg:col-span-2">
            <DetailList items={[
              ['Reported problem', job.reportedProblem], ['Services', job.services?.map((x) => x.name).join(', ') || '—'],
              ['Checked in', formatDateTime(job.checkInAt)], ['Expected completion', job.expectedCompletion ? formatDate(job.expectedCompletion) : '—'],
              ['Odometer in', `${job.odometerIn.toLocaleString('en-IN')} km`], ['Assigned mechanic', job.assignedMechanic?.name ?? 'Unassigned'],
              !isCustomer && ['Labour logged', `${(job.labourMinutes / 60).toFixed(1)} h`], job.qualityCheck?.at && ['Quality check', `${job.qualityCheck.passed ? 'Passed' : 'Failed'} · ${formatDateTime(job.qualityCheck.at)}`],
            ]} />
            {!isCustomer && job.internalNotes && <div className="mt-5 pt-5 border-t border-border"><p className="text-overline uppercase text-text-muted">Internal notes</p><p className="text-body-sm mt-1 whitespace-pre-line">{job.internalNotes}</p></div>}
          </SectionCard>
          <SectionCard title="Customer & vehicle">
            <DetailList columns={1} items={[['Customer', job.customer?.name], !isCustomer && ['Phone', job.customer?.phone], ['Vehicle', `${job.vehicle?.make} ${job.vehicle?.model} (${job.vehicle?.year})`], ['Registration', job.vehicle?.registrationNumber]]} />
            {!isCustomer && <div className="mt-4 flex gap-2"><LinkButton to={`/app/vehicles/${job.vehicle?._id}`} variant="outline" size="sm">Vehicle history</LinkButton>{!['customer', 'mechanic'].includes(role) && <LinkButton to={`/app/customers/${job.customer?._id}`} variant="outline" size="sm">Customer</LinkButton>}</div>}
          </SectionCard>
        </div>
      )}

      {tab === 'inspection' && (
        <div className="space-y-4">
          {inspections.data?.length ? inspections.data.map((i) => <SectionCard key={i._id} title={`Inspection · ${formatDateTime(i.inspectedAt)}`}><InspectionSummary inspection={i} /></SectionCard>)
            : <div className="card"><EmptyState title="No inspection recorded" message="An inspection is required before an estimate can be prepared." action={!isCustomer && canWork && ['checked_in', 'inspection'].includes(s) && <Button size="sm" onClick={() => setInspOpen(true)}>Record inspection</Button>} /></div>}
        </div>
      )}

      {tab === 'estimate' && (
        <div className="space-y-3">
          {estimates.data?.length ? estimates.data.map((e) => (
            <button key={e._id} type="button" onClick={() => navigate(`/app/estimates/${e._id}`)} className="card-hover w-full text-left p-4 flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-semibold">{e.estimateNo} <span className="text-text-muted font-normal">· revision {e.revision}</span></p><p className="text-caption text-text-muted">{formatDateTime(e.createdAt)}</p></div>
              <div className="flex items-center gap-3"><span className="font-semibold">{formatMoney(e.total)}</span><StatusBadge status={e.status} /></div>
            </button>))
            : <div className="card"><EmptyState title="No estimates yet" message={s === 'awaiting_estimate' ? 'The inspection is done — prepare an estimate for the customer.' : 'Estimates appear after the inspection.'} action={isAdvisor && s === 'awaiting_estimate' && <LinkButton to={`/app/estimates/new?job=${id}`} size="sm">Prepare estimate</LinkButton>} /></div>}
        </div>
      )}

      {tab === 'work' && <JobWorkPanel job={job} canWork={canWork} canIssueParts={hasRole('super_admin', 'workshop_admin', 'inventory_manager')} onChange={reload} />}

      {tab === 'timeline' && (
        <SectionCard title="Status history">
          <ol className="space-y-4">{[...job.history].reverse().map((h, i) => (
            <li key={i} className="flex gap-3"><span className="w-2.5 h-2.5 rounded-full bg-brand-charcoal mt-1.5 shrink-0" aria-hidden="true" />
              <div><p className="text-body-sm font-medium">{h.from ? <>{humanize(h.from)} → {humanize(h.to)}</> : humanize(h.to)}</p>{h.note && <p className="text-body-sm text-text-secondary">{h.note}</p>}<p className="text-caption text-text-muted">{formatDateTime(h.at)}{h.by?.name && !isCustomer ? ` · ${h.by.name}` : ''}</p></div></li>))}</ol>
        </SectionCard>
      )}

      <InspectionFormDialog open={inspOpen} onClose={() => setInspOpen(false)} jobId={id} onSaved={() => { toast.success('Inspection saved'); reload(); setTab('inspection'); }} />
      <FormDialog open={edit} onClose={() => setEdit(false)} title="Edit job card" key={String(edit)}
        fields={[
          { name: 'assignedMechanic', label: 'Assigned mechanic', type: 'select', options: mechanics }, { name: 'priority', label: 'Priority', type: 'select', required: true, options: PRIORITY_OPTIONS },
          { name: 'expectedCompletion', label: 'Expected completion', type: 'date' }, { name: 'reportedProblem', label: 'Reported problem', type: 'textarea', required: true }, { name: 'internalNotes', label: 'Internal notes', type: 'textarea' }]}
        initial={{ assignedMechanic: job.assignedMechanic?._id ?? '', priority: job.priority, expectedCompletion: job.expectedCompletion ? toDateInput(job.expectedCompletion) : '', reportedProblem: job.reportedProblem, internalNotes: job.internalNotes ?? '' }}
        submitLabel="Save changes" onSubmit={async (v) => { await patch(`/jobs/${id}`, { ...v, assignedMechanic: v.assignedMechanic || '' }); toast.success('Job updated'); reload(); }} />
      <FormDialog open={qc} onClose={() => setQc(false)} size="sm" title="Quality check" description="Confirm the repair meets workshop standards." key={`qc${qc}`}
        fields={[{ name: 'passed', label: 'Result', type: 'select', required: true, options: [{ value: 'true', label: 'Pass — ready for invoicing' }, { value: 'false', label: 'Fail — send back to mechanic' }], span: 2 }, { name: 'notes', label: 'Notes', type: 'textarea', span: 2, helper: 'Required when failing', validate: (v, all) => (all.passed === 'false' && !v ? 'Explain what needs rework' : null) }]}
        initial={{}} submitLabel="Submit result"
        onSubmit={async (v) => { await post(`/jobs/${id}/quality-check`, { passed: v.passed === 'true', notes: v.notes }); toast.success(v.passed === 'true' ? 'Quality check passed' : 'Sent back for rework'); reload(); }} />
      <ConfirmDialog open={confirm === 'cancel'} onClose={() => setConfirm(null)} danger loading={busy} title="Cancel this job?" message="Open estimates are withdrawn. This cannot be undone." confirmLabel="Cancel job" cancelLabel="Keep job" onConfirm={() => go('cancelled', 'Job cancelled')} />
      {pay && invoice && <PaymentDialog invoice={invoice} onClose={() => setPay(false)} onDone={() => { toast.success('Payment recorded'); reload(); }} />}
    </Page>
  );
}
