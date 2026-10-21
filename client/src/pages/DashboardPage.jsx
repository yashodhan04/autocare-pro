import { Link } from 'react-router-dom';
import {
  Users,
  Car,
  Calendar,
  ClipboardList,
  Wrench,
  Layers,
  Activity,
  ArrowRight,
  Palette,
  ExternalLink,
  Info,
  Clock,
  Sparkles,
  Database,
  Radio,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Card, SectionCard } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { EmptyState } from '../components/ui/States.jsx';

/**
 * DashboardPage — AutoCare Pro Workshop Operations Landing Page.
 *
 * Implements:
 *   A. Page Header (heading, description, actions)
 *   B. Quick Actions (navigates to respective module placeholder pages)
 *   C. Dashboard Content (Workshop overview, Appointments, Service jobs, Activity)
 *   D. Polished Empty States (honest explanations without fake statistics)
 */
export default function DashboardPage() {
  const quickActions = [
    {
      id: 'customer',
      title: 'Add Customer',
      description: 'Register customer profile, contact details, and account preferences.',
      path: '/app/customers',
      icon: Users,
      module: 'Module 2: In Planning',
    },
    {
      id: 'vehicle',
      title: 'Register Vehicle',
      description: 'Add vehicle record with VIN, registration number, and service log.',
      path: '/app/vehicles',
      icon: Car,
      module: 'Module 3: In Planning',
    },
    {
      id: 'appointment',
      title: 'Book Appointment',
      description: 'Schedule a workshop booking, service bay allocation, and service type.',
      path: '/app/appointments',
      icon: Calendar,
      module: 'Module 4: In Planning',
    },
    {
      id: 'service-job',
      title: 'Create Service Job',
      description: 'Open a job card for repair tasks, technician assignment, and parts usage.',
      path: '/app/service-jobs',
      icon: ClipboardList,
      module: 'Module 5: In Planning',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Section A: Page Header ─────────────────────────────────────── */}
      <PageHeader
        title="Workshop Operations"
        description="Central management hub for service bays, appointments, repair orders, and spare parts inventory."
        badge={
          <Badge variant="outline" color="lime" dot>
            Step 3 Application Shell Active
          </Badge>
        }
        actions={
          <>
            <Link to="/design-system" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <Palette size={15} aria-hidden="true" />
                <span>Design System</span>
                <ExternalLink size={12} className="text-text-muted" aria-hidden="true" />
              </Button>
            </Link>
          </>
        }
      />

      {/* ── Architectural Notice Banner ───────────────────────────────── */}
      <div className="rounded-2xl border border-brand-charcoal-soft bg-surface-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-brand-charcoal flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Sparkles size={18} className="text-brand-lime" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-body-sm font-semibold text-text-primary">
                Application Shell &amp; Navigation Ready
              </p>
              <Badge variant="pill" color="neutral" size="sm">
                Development Preview
              </Badge>
            </div>
            <p className="text-caption text-text-muted mt-0.5 max-w-2xl">
              The layout, dark sidebar, top navigation, search modal, and UI component system are operational.
              Backend Mongoose business modules will be connected in subsequent steps without fabricating fake metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <span className="text-caption font-mono text-text-muted flex items-center gap-1.5 bg-surface-muted px-2.5 py-1 rounded-lg border border-border">
            <Database size={13} className="text-brand-charcoal-text" aria-hidden="true" />
            MongoDB Ready
          </span>
          <span className="text-caption font-mono text-text-muted flex items-center gap-1.5 bg-surface-muted px-2.5 py-1 rounded-lg border border-border">
            <Radio size={13} className="text-success" aria-hidden="true" />
            Socket.IO Attached
          </span>
        </div>
      </div>

      {/* ── Section B: Quick Actions ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-text-primary">Quick Actions</h2>
            <p className="text-caption text-text-muted">
              Initiate workshop workflows (each links to its respective module roadmap)
            </p>
          </div>
          <span className="text-caption text-text-muted">4 Actions Prepared</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.id}
                to={action.path}
                className="group relative rounded-2xl border border-border bg-surface-card p-4 transition-all duration-200 hover:border-brand-charcoal hover:shadow-card hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center text-text-primary group-hover:bg-brand-charcoal group-hover:text-brand-lime transition-colors">
                      <Icon size={20} aria-hidden="true" />
                    </div>
                    <Badge variant="pill" color="neutral" size="sm">
                      {action.module}
                    </Badge>
                  </div>
                  <h3 className="text-body-sm font-semibold text-text-primary group-hover:text-brand-charcoal transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-caption text-text-muted mt-1 line-clamp-2">
                    {action.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-caption font-medium text-text-primary group-hover:text-brand-charcoal">
                  <span>View Module Plan</span>
                  <ArrowRight
                    size={14}
                    className="text-text-muted group-hover:text-brand-charcoal group-hover:translate-x-0.5 transition-all"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Section C.1: Workshop Overview ────────────────────────────── */}
      <SectionCard
        title="Workshop Bay Overview & Lift Capacity"
        subtitle="Real-time occupancy status across workshop service bays and inspection racks"
        action={
          <Badge variant="outline" color="neutral" size="sm">
            Module 5 Target
          </Badge>
        }
      >
        <EmptyState
          icon={Layers}
          title="Service Bay Tracking Inactive"
          description="Live bay occupancy, lift allocation, and technician scheduling will populate here automatically once Work Orders & Service Jobs (Module 5) are persisted in MongoDB."
          action={
            <Link to="/app/service-jobs">
              <Button variant="outline" size="sm">
                View Service Jobs Plan
              </Button>
            </Link>
          }
        />
      </SectionCard>

      {/* ── Section C.2 & C.3: Two-Column Section (Appointments & Service Jobs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Section */}
        <SectionCard
          title="Today's Appointments"
          subtitle="Scheduled customer vehicle drop-offs and consultations"
          action={
            <Badge variant="outline" color="neutral" size="sm">
              Module 4
            </Badge>
          }
        >
          <EmptyState
            icon={Calendar}
            title="No Appointments Scheduled"
            description="Customer bookings, time slots, assigned service advisors, and intake statuses will appear here once the Appointments module is live."
            action={
              <Link to="/app/appointments">
                <Button variant="outline" size="sm">
                  Open Appointments
                </Button>
              </Link>
            }
          />
        </SectionCard>

        {/* Active Service Jobs Section */}
        <SectionCard
          title="Active Service Jobs"
          subtitle="Job cards currently in progress on the workshop floor"
          action={
            <Badge variant="outline" color="neutral" size="sm">
              Module 5
            </Badge>
          }
        >
          <EmptyState
            icon={ClipboardList}
            title="No Active Job Cards"
            description="Work orders awaiting parts, in-progress repairs, diagnostic checklists, and technician assignments will display here when job cards are created."
            action={
              <Link to="/app/service-jobs">
                <Button variant="outline" size="sm">
                  Open Service Jobs
                </Button>
              </Link>
            }
          />
        </SectionCard>
      </div>

      {/* ── Section C.4: Recent Workshop Activity ─────────────────────── */}
      <SectionCard
        title="Recent Workshop Activity"
        subtitle="Audit log of work order state transitions, parts issued, and customer updates"
        action={
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success inline-block animate-pulse" />
            <span className="text-caption text-text-muted font-mono">Stream Ready</span>
          </div>
        }
      >
        <EmptyState
          icon={Activity}
          title="Activity Stream Standing By"
          description="Operational events (such as appointment confirmations, mechanic job completions, inventory threshold alerts, and invoice payments) will stream in real time via Socket.IO push updates."
          action={
            <Link to="/app/reports">
              <Button variant="outline" size="sm">
                View Reports Module
              </Button>
            </Link>
          }
        />
      </SectionCard>
    </div>
  );
}
