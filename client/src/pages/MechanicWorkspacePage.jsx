import { Link, useNavigate } from 'react-router-dom';
import { Play, Clock, ListChecks, PackageSearch, ArrowRight } from 'lucide-react';
import { Page } from '../components/common/Page.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { MetricCard } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState, ErrorState } from '../components/ui/States.jsx';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import { post, parseError } from '../services/api.js';
import { formatDate } from '../utils/format.js';

const LANES = [
  { id: 'ready', title: 'Ready to start', hint: 'Estimate approved', statuses: ['approved'] },
  { id: 'doing', title: 'In progress', hint: 'Log tasks, time and parts', statuses: ['in_progress'] },
  { id: 'pre', title: 'Inspection & estimate', hint: 'Waiting on inspection or customer approval', statuses: ['checked_in', 'inspection', 'awaiting_estimate', 'awaiting_approval'] },
  { id: 'qc', title: 'Quality check', hint: 'Waiting for the advisor', statuses: ['quality_check'] },
];

/** Mechanic-only landing page: the jobs assigned to me, grouped by what I can do next. */
export default function MechanicWorkspacePage() {
  const jobs = useFetch('/jobs', { status: 'active', limit: 100 });
  const navigate = useNavigate();
  const toast = useToast();
  const list = jobs.data ?? [];

  async function start(e, job) {
    e.stopPropagation();
    try { await post(`/jobs/${job._id}/transition`, { to: 'in_progress' }); toast.success('Work started', job.jobNo); navigate(`/app/service-jobs/${job._id}?tab=work`); } catch (err) { toast.error('Cannot start work', parseError(err).message); }
  }

  const stats = [
    { label: 'Assigned jobs', value: list.length, icon: <ListChecks size={18} /> },
    { label: 'In progress', value: list.filter((j) => j.status === 'in_progress').length, icon: <Play size={18} /> },
    { label: 'Parts pending', value: list.filter((j) => j.partRequests?.some((p) => p.status === 'requested')).length, icon: <PackageSearch size={18} /> },
    { label: 'Hours logged', value: (list.reduce((s, j) => s + (j.labourMinutes ?? 0), 0) / 60).toFixed(1), icon: <Clock size={18} /> },
  ];

  return (
    <Page title="My workspace" description="Jobs assigned to you. Open a job to review inspection findings, record work and request parts.">
      {jobs.error && <ErrorState title="Couldn't load your jobs" message={jobs.error} action={<Button size="sm" variant="outline" onClick={jobs.reload}>Try again</Button>} />}
      {jobs.loading && !jobs.data && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}
      {jobs.data && (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">{stats.map((s) => <MetricCard key={s.label} label={s.label} value={s.value} icon={s.icon} />)}</div>
          {list.length === 0 ? <div className="card"><EmptyState title="No jobs assigned to you" message="When an advisor assigns you a job card it will appear here." /></div> : (
            <div className="grid gap-6 lg:grid-cols-2">
              {LANES.map((lane) => {
                const items = list.filter((j) => lane.statuses.includes(j.status));
                return (
                  <section key={lane.id} aria-labelledby={`lane-${lane.id}`} className="space-y-3">
                    <div><h2 id={`lane-${lane.id}`} className="text-h4 font-semibold">{lane.title} <span className="text-text-muted font-normal">({items.length})</span></h2><p className="text-caption text-text-muted">{lane.hint}</p></div>
                    {items.length === 0 ? <p className="card p-4 text-body-sm text-text-muted">Nothing here.</p> : items.map((j) => (
                      <article key={j._id} className="card-hover p-4 cursor-pointer" onClick={() => navigate(`/app/service-jobs/${j._id}`)}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0"><Link to={`/app/service-jobs/${j._id}`} className="font-mono text-caption font-bold hover:underline">{j.jobNo}</Link>
                            <p className="font-semibold mt-0.5">{j.vehicle?.make} {j.vehicle?.model} <span className="text-text-muted font-normal">{j.vehicle?.registrationNumber}</span></p>
                            <p className="text-body-sm text-text-secondary line-clamp-2 mt-1">{j.reportedProblem}</p></div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0"><StatusBadge status={j.priority} /><StatusBadge status={j.status} /></div>
                        </div>
                        <div className="flex items-center justify-between mt-3 text-caption text-text-muted">
                          <span>Due {j.expectedCompletion ? formatDate(j.expectedCompletion) : 'not set'}</span>
                          {j.status === 'approved' ? <Button size="sm" icon={<Play size={14} />} onClick={(e) => start(e, j)}>Start work</Button> : <span className="inline-flex items-center gap-1 text-text-secondary font-medium">Open <ArrowRight size={13} aria-hidden="true" /></span>}
                        </div>
                      </article>))}
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </Page>
  );
}
