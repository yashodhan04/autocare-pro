import { useState } from 'react';
import {
  Wrench, Car, Settings, Bell, User, Plus, Trash2, Edit2, Download,
  Search, Filter, MoreVertical, Star, Zap, Shield, Activity, TrendingUp,
  AlertCircle, CheckCircle2, Info, Clock, ChevronRight, Package,
  FileText, BarChart2, Users, Calendar, DollarSign, Eye, EyeOff,
  LayoutDashboard, Palette, Type, Square, ToggleLeft, MessageSquare,
  Layers, Navigation, Grid, Inbox, X,
} from 'lucide-react';

import { Button } from '../components/ui/Button.jsx';
import {
  FormField, Input, PasswordInput, SearchInput, Textarea, Select, Checkbox, Switch,
} from '../components/ui/Form.jsx';
import { Card, SectionCard, MetricCard } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Dialog } from '../components/ui/Dialog.jsx';
import { ToastContainer, useToast } from '../components/ui/Toast.jsx';
import { Skeleton, SkeletonCard, SkeletonTable } from '../components/ui/Skeleton.jsx';
import { Breadcrumbs } from '../components/ui/Breadcrumbs.jsx';
import { Tabs, TabPanel } from '../components/ui/Tabs.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { Dropdown, DropdownTrigger } from '../components/ui/Dropdown.jsx';
import { Tooltip } from '../components/ui/Tooltip.jsx';
import { EmptyState, ErrorState, SuccessState, ConfirmDialog } from '../components/ui/States.jsx';

/* ── Section wrapper ──────────────────────────────────────── */
function Section({ id, title, description, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-6">
        <h2 className="text-h3 font-bold text-text-primary">{title}</h2>
        {description && (
          <p className="text-body-sm text-text-muted mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

/* ── Subsection ───────────────────────────────────────────── */
function Sub({ label, children }) {
  return (
    <div>
      <p className="text-overline text-text-muted mb-3 uppercase">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

/* ── Demo block (card wrapper) ────────────────────────────── */
function DemoBlock({ label, children, className }) {
  return (
    <div className="card p-5">
      {label && <p className="text-overline text-text-muted mb-4 uppercase">{label}</p>}
      <div className={className}>{children}</div>
    </div>
  );
}

/* ── Colour swatch ────────────────────────────────────────── */
function Swatch({ color, label, hex, border }) {
  return (
    <div className="flex flex-col items-start gap-1.5 min-w-[80px]">
      <div
        className="w-16 h-16 rounded-xl shadow-sm"
        style={{
          background: color,
          border: border ? '1px solid #E3E6ED' : undefined,
        }}
      />
      <div>
        <p className="text-xs font-medium text-text-primary">{label}</p>
        {hex && <p className="text-[11px] text-text-muted font-mono">{hex}</p>}
      </div>
    </div>
  );
}

/* ── Sidebar nav items ────────────────────────────────────── */
const NAV_SECTIONS = [
  { id: 'colors',     label: 'Colours',       icon: <Palette size={15} /> },
  { id: 'typography', label: 'Typography',    icon: <Type size={15} /> },
  { id: 'buttons',    label: 'Buttons',       icon: <Square size={15} /> },
  { id: 'forms',      label: 'Form Controls', icon: <ToggleLeft size={15} /> },
  { id: 'cards',      label: 'Cards',         icon: <Layers size={15} /> },
  { id: 'badges',     label: 'Badges',        icon: <Star size={15} /> },
  { id: 'skeletons',  label: 'Skeletons',     icon: <Activity size={15} /> },
  { id: 'states',     label: 'States',        icon: <Inbox size={15} /> },
  { id: 'toasts',     label: 'Toasts',        icon: <MessageSquare size={15} /> },
  { id: 'dialogs',    label: 'Dialogs',       icon: <MessageSquare size={15} /> },
  { id: 'tabs',       label: 'Tabs',          icon: <LayoutDashboard size={15} /> },
  { id: 'navigation', label: 'Navigation',    icon: <Navigation size={15} /> },
  { id: 'pagination', label: 'Pagination',    icon: <Grid size={15} /> },
];

/* ══════════════════════════════════════════════════════════ */
/*  DesignSystemPage                                          */
/* ══════════════════════════════════════════════════════════ */
export default function DesignSystemPage() {
  /* Dialog state */
  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [confirmOpen,   setConfirmOpen]   = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);

  /* Form demo state */
  const [switchOn,   setSwitchOn]   = useState(false);
  const [checked,    setChecked]    = useState(false);
  const [searchVal,  setSearchVal]  = useState('');
  const [tabActive,  setTabActive]  = useState('overview');
  const [tabPill,    setTabPill]    = useState('all');
  const [page,       setPage]       = useState(3);

  /* Toast */
  const { toasts, toast, dismiss } = useToast();

  return (
    <div className="min-h-screen bg-surface-page flex">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 sticky top-0 h-screen bg-brand-charcoal border-r border-brand-charcoal-soft overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-brand-charcoal-soft">
          <div className="w-9 h-9 rounded-xl bg-brand-lime flex items-center justify-center shrink-0">
            <Wrench size={18} className="text-brand-charcoal" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">AutoCare Pro</p>
            <p className="text-[11px] text-brand-lime font-medium">Design System</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Design system sections">
          {NAV_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-brand-charcoal-text hover:text-white hover:bg-brand-charcoal-soft text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime"
            >
              <span className="shrink-0 opacity-70">{s.icon}</span>
              {s.label}
            </a>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-brand-charcoal-soft">
          <p className="text-[11px] text-brand-charcoal-text">
            Step 2 — Design System v1.0
          </p>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-[200] bg-surface-card/90 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <Breadcrumbs
              items={[
                { label: 'AutoCare Pro' },
                { label: 'Development' },
                { label: 'Design System' },
              ]}
            />
            <h1 className="text-h3 font-bold text-text-primary mt-0.5">Design System</h1>
          </div>
          <Badge variant="lime" pill dot>v1.0 · Live Preview</Badge>
        </header>

        <main className="px-6 py-8 max-w-5xl mx-auto space-y-16">

          {/* ── COLOURS ─────────────────────────────────────── */}
          <Section
            id="colors"
            title="Colour Palette"
            description="The complete AutoCare Pro design token set. Electric lime is used for primary accents and focus rings."
          >
            <DemoBlock label="Brand">
              <div className="flex flex-wrap gap-6">
                <Swatch color="#C8F135" label="Lime"         hex="#C8F135" />
                <Swatch color="#B8E020" label="Lime Hover"   hex="#B8E020" />
                <Swatch color="#EAF9A0" label="Lime Muted"   hex="#EAF9A0" border />
                <Swatch color="#18191F" label="Charcoal"     hex="#18191F" />
                <Swatch color="#22262F" label="Charcoal Mid" hex="#22262F" />
                <Swatch color="#2C3140" label="Charcoal Soft" hex="#2C3140" />
                <Swatch color="#9BA3AF" label="Charcoal Text" hex="#9BA3AF" />
              </div>
            </DemoBlock>

            <DemoBlock label="Surfaces & Text">
              <div className="flex flex-wrap gap-6">
                <Swatch color="#F5F6F8" label="Page"      hex="#F5F6F8" border />
                <Swatch color="#FFFFFF" label="Card"      hex="#FFFFFF" border />
                <Swatch color="#F0F1F4" label="Muted"     hex="#F0F1F4" border />
                <Swatch color="#18191F" label="Primary"   hex="#18191F" />
                <Swatch color="#5A6070" label="Secondary" hex="#5A6070" />
                <Swatch color="#8B93A5" label="Muted"     hex="#8B93A5" />
                <Swatch color="#B8BDC9" label="Disabled"  hex="#B8BDC9" />
              </div>
            </DemoBlock>

            <DemoBlock label="Semantic">
              <div className="flex flex-wrap gap-6">
                <Swatch color="#16A34A" label="Success" hex="#16A34A" />
                <Swatch color="#D97706" label="Warning" hex="#D97706" />
                <Swatch color="#DC2626" label="Danger"  hex="#DC2626" />
                <Swatch color="#2563EB" label="Info"    hex="#2563EB" />
                <Swatch color="#F0FDF4" label="Success Light" hex="#F0FDF4" border />
                <Swatch color="#FFFBEB" label="Warning Light" hex="#FFFBEB" border />
                <Swatch color="#FFF1F2" label="Danger Light"  hex="#FFF1F2" border />
                <Swatch color="#EFF6FF" label="Info Light"    hex="#EFF6FF" border />
              </div>
            </DemoBlock>
          </Section>

          {/* ── TYPOGRAPHY ──────────────────────────────────── */}
          <Section
            id="typography"
            title="Typography"
            description="Inter for interface text, JetBrains Mono for code. Consistent weight, line-height, and tracking across all levels."
          >
            <div className="card p-6 space-y-5">
              <div className="border-b border-border pb-4">
                <span className="text-overline text-text-muted">Display — 2.5rem / 700</span>
                <p className="text-display font-bold text-text-primary mt-1 text-balance">AutoCare Pro Platform</p>
              </div>
              <div className="border-b border-border pb-4">
                <span className="text-overline text-text-muted">H1 Page Title — 2rem / 700</span>
                <h1 className="text-h1 mt-1">Workshop Dashboard</h1>
              </div>
              <div className="border-b border-border pb-4">
                <span className="text-overline text-text-muted">H2 Section — 1.5rem / 600</span>
                <h2 className="text-h2 mt-1">Recent Service Orders</h2>
              </div>
              <div className="border-b border-border pb-4">
                <span className="text-overline text-text-muted">H3 — 1.25rem / 600</span>
                <h3 className="text-h3 mt-1">Vehicle Details</h3>
              </div>
              <div className="border-b border-border pb-4">
                <span className="text-overline text-text-muted">H4 Card Heading — 1.125rem / 600</span>
                <h4 className="text-h4 mt-1">Toyota Camry — KA-01-AB-1234</h4>
              </div>
              <div className="border-b border-border pb-4">
                <span className="text-overline text-text-muted">Body Large — 1.0625rem</span>
                <p className="text-body-lg text-text-primary mt-1">Service technicians can efficiently manage vehicle intake, diagnostics, and repair workflows all in one place.</p>
              </div>
              <div className="border-b border-border pb-4">
                <span className="text-overline text-text-muted">Body — 0.9375rem</span>
                <p className="text-body text-text-primary mt-1">The oil filter was replaced and engine oil topped up to the manufacturer specification. Customer was advised to return in 10,000 km for the next service.</p>
              </div>
              <div className="border-b border-border pb-4">
                <span className="text-overline text-text-muted">Body Small — 0.875rem</span>
                <p className="text-body-sm text-text-secondary mt-1">Last updated 2 hours ago by Technician Ravi Kumar</p>
              </div>
              <div className="border-b border-border pb-4">
                <span className="text-overline text-text-muted">Caption — 0.8125rem</span>
                <p className="text-caption text-text-muted mt-1">Invoice #INV-20241021-0042 · Created 21 Oct 2026</p>
              </div>
              <div>
                <span className="text-overline text-text-muted">Label — 0.875rem / 500</span>
                <p className="text-label text-text-primary mt-1">Chassis Number <span className="text-danger">*</span></p>
              </div>
            </div>

            {/* Mono */}
            <div className="card p-5">
              <span className="text-overline text-text-muted">Monospace — JetBrains Mono</span>
              <pre className="mt-3 text-sm font-mono text-text-primary bg-surface-muted rounded-lg p-4 overflow-x-auto">
{`GET /api/v1/vehicles?page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json`}
              </pre>
            </div>
          </Section>

          {/* ── BUTTONS ─────────────────────────────────────── */}
          <Section
            id="buttons"
            title="Buttons"
            description="All button variants, sizes, states, and icon configurations."
          >
            <DemoBlock label="Variants">
              <Button variant="primary">Primary Action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Destructive</Button>
            </DemoBlock>

            <DemoBlock label="Sizes">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </DemoBlock>

            <DemoBlock label="With Icons">
              <Button icon={<Plus size={16} />}>Add Vehicle</Button>
              <Button variant="secondary" icon={<Download size={16} />}>Export</Button>
              <Button variant="outline" icon={<Filter size={16} />}>Filter</Button>
              <Button variant="danger" icon={<Trash2 size={16} />}>Delete</Button>
            </DemoBlock>

            <DemoBlock label="Icon-Only Buttons">
              <Button iconOnly icon={<Plus size={18} />} aria-label="Add" />
              <Button iconOnly icon={<Edit2 size={18} />} variant="outline" aria-label="Edit" />
              <Button iconOnly icon={<Trash2 size={18} />} variant="danger" aria-label="Delete" />
              <Button iconOnly icon={<Bell size={18} />} variant="ghost" aria-label="Notifications" />
            </DemoBlock>

            <DemoBlock label="States">
              <Button loading>Saving…</Button>
              <Button variant="secondary" loading>Processing</Button>
              <Button disabled>Disabled</Button>
              <Button variant="outline" disabled>Not Available</Button>
            </DemoBlock>
          </Section>

          {/* ── FORM CONTROLS ───────────────────────────────── */}
          <Section
            id="forms"
            title="Form Controls"
            description="All input types with label, helper, validation error, and disabled states."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="Full Name" htmlFor="ds-name" required>
                <Input id="ds-name" placeholder="e.g. Ravi Kumar" />
              </FormField>

              <FormField label="Email Address" htmlFor="ds-email">
                <Input id="ds-email" type="email" placeholder="ravi@example.com" />
              </FormField>

              <FormField label="Password" htmlFor="ds-password" helper="Minimum 8 characters">
                <PasswordInput id="ds-password" placeholder="Enter password" />
              </FormField>

              <FormField label="Phone Number" htmlFor="ds-phone" error="Invalid phone number format">
                <Input id="ds-phone" type="tel" placeholder="+91 98765 43210" error />
              </FormField>

              <FormField label="Search Vehicles" htmlFor="ds-search">
                <SearchInput
                  id="ds-search"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onClear={() => setSearchVal('')}
                  placeholder="Search by plate number…"
                />
              </FormField>

              <FormField label="Service Type" htmlFor="ds-select">
                <Select id="ds-select">
                  <option value="">— Select service type —</option>
                  <option>Oil Change</option>
                  <option>Tyre Replacement</option>
                  <option>Full Service</option>
                  <option>Brake Inspection</option>
                </Select>
              </FormField>

              <FormField label="Left icon input" htmlFor="ds-icon">
                <Input
                  id="ds-icon"
                  leftIcon={<Car size={15} />}
                  placeholder="Vehicle registration"
                />
              </FormField>

              <FormField label="Disabled Input" htmlFor="ds-disabled">
                <Input id="ds-disabled" value="KA-01-AB-1234" disabled readOnly />
              </FormField>
            </div>

            <div className="card p-5">
              <p className="text-overline text-text-muted mb-4 uppercase">Textarea</p>
              <FormField label="Service Notes" htmlFor="ds-notes" helper="Describe the issue reported by the customer.">
                <Textarea id="ds-notes" rows={4} placeholder="Customer reported a rattling noise from the front-left wheel…" />
              </FormField>
            </div>

            <div className="card p-5 space-y-4">
              <p className="text-overline text-text-muted uppercase">Checkbox & Switch</p>
              <div className="flex flex-wrap gap-6">
                <Checkbox id="ds-cb1" label="Send SMS notification to customer" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
                <Checkbox id="ds-cb2" label="Mark as urgent" />
                <Checkbox id="ds-cb3" label="Disabled option" disabled />
              </div>
              <div className="flex flex-wrap gap-6 pt-2">
                <Switch id="ds-sw1" label="Email alerts" checked={switchOn} onChange={setSwitchOn} />
                <Switch id="ds-sw2" label="Auto-assign technician" checked={true} onChange={() => {}} />
                <Switch id="ds-sw3" label="Disabled toggle" disabled />
              </div>
            </div>
          </Section>

          {/* ── CARDS ────────────────────────────────────────── */}
          <Section
            id="cards"
            title="Cards"
            description="Surface components for content grouping."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                label="Total Vehicles"
                value="1,248"
                delta="↑ 8.4% this month"
                deltaType="up"
                icon={<Car size={20} className="text-brand-charcoal" />}
                iconColor="bg-brand-lime-muted"
              />
              <MetricCard
                label="Open Work Orders"
                value="47"
                delta="↓ 3 from yesterday"
                deltaType="down"
                icon={<Wrench size={20} className="text-info" />}
                iconColor="bg-info-muted"
              />
              <MetricCard
                label="Revenue (MTD)"
                value="₹4.2L"
                delta="On track for target"
                deltaType="neutral"
                icon={<DollarSign size={20} className="text-success" />}
                iconColor="bg-success-muted"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card hover>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-lime-muted flex items-center justify-center">
                    <Car size={18} className="text-brand-charcoal" />
                  </div>
                  <div>
                    <p className="text-body-sm font-semibold text-text-primary">Toyota Camry 2022</p>
                    <p className="text-caption text-text-muted">KA-01-AB-1234</p>
                  </div>
                </div>
                <p className="text-body-sm text-text-secondary">Customer: Rajesh Sharma · Last visit: 15 Oct 2026</p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="success" dot>Active</Badge>
                  <Badge variant="info">Service Due</Badge>
                </div>
              </Card>

              <SectionCard
                title="Quick Actions"
                subtitle="Common workshop operations"
                action={<Button size="sm" variant="outline" icon={<Plus size={14} />}>New</Button>}
              >
                <div className="space-y-2">
                  {['Create Work Order', 'Add Vehicle', 'Generate Invoice', 'Schedule Service'].map((label) => (
                    <button key={label} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-body-sm text-text-primary hover:bg-surface-muted transition-colors text-left">
                      {label}
                      <ChevronRight size={15} className="text-text-muted" />
                    </button>
                  ))}
                </div>
              </SectionCard>
            </div>
          </Section>

          {/* ── BADGES ───────────────────────────────────────── */}
          <Section
            id="badges"
            title="Badges"
            description="Status indicators with semantic variants, dots, and pill shapes."
          >
            <DemoBlock label="Semantic Variants">
              <Badge variant="success">Completed</Badge>
              <Badge variant="warning">Pending</Badge>
              <Badge variant="danger">Overdue</Badge>
              <Badge variant="info">In Progress</Badge>
              <Badge variant="lime">New</Badge>
              <Badge variant="neutral">Draft</Badge>
            </DemoBlock>

            <DemoBlock label="With Dot">
              <Badge variant="success" dot>Online</Badge>
              <Badge variant="warning" dot>Away</Badge>
              <Badge variant="danger" dot>Offline</Badge>
              <Badge variant="info" dot>Syncing</Badge>
            </DemoBlock>

            <DemoBlock label="Pill Shape">
              <Badge variant="success" pill dot>Active</Badge>
              <Badge variant="warning" pill>Due Soon</Badge>
              <Badge variant="danger" pill>Critical</Badge>
              <Badge variant="info" pill>Info</Badge>
              <Badge variant="lime" pill>Featured</Badge>
            </DemoBlock>

            <DemoBlock label="Small Size">
              <Badge variant="success" size="sm">Done</Badge>
              <Badge variant="warning" size="sm">Review</Badge>
              <Badge variant="danger" size="sm">Error</Badge>
              <Badge variant="neutral" size="sm">v1.0</Badge>
            </DemoBlock>
          </Section>

          {/* ── SKELETONS ────────────────────────────────────── */}
          <Section
            id="skeletons"
            title="Loading Skeletons"
            description="Shimmer loading placeholders for async content."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SkeletonCard />
              <div className="space-y-4">
                <div className="card p-5 space-y-3">
                  <p className="text-overline text-text-muted uppercase">Text Skeleton</p>
                  <Skeleton lines={4} />
                </div>
                <div className="card p-5 space-y-3">
                  <p className="text-overline text-text-muted uppercase">Shape Skeletons</p>
                  <div className="flex gap-3 items-center">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <Skeleton className="w-24 h-8 rounded-lg" />
                    <Skeleton className="w-16 h-6 rounded-pill" />
                  </div>
                </div>
              </div>
            </div>
            <SkeletonTable rows={4} cols={5} />
          </Section>

          {/* ── STATES ───────────────────────────────────────── */}
          <Section
            id="states"
            title="Empty, Error & Success States"
            description="Feedback states for data boundaries and action outcomes."
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card">
                <EmptyState
                  icon={<Package size={28} />}
                  title="No vehicles found"
                  message="Add your first vehicle to get started."
                  action={<Button size="sm" icon={<Plus size={14} />}>Add Vehicle</Button>}
                  compact
                />
              </div>
              <div className="card">
                <ErrorState
                  title="Failed to load"
                  message="Could not connect to the server. Check your connection."
                  action={<Button size="sm" variant="outline">Retry</Button>}
                />
              </div>
              <div className="card">
                <SuccessState
                  title="Payment received"
                  message="Invoice INV-0042 has been marked as paid."
                  action={<Button size="sm" variant="outline">View Invoice</Button>}
                />
              </div>
            </div>
          </Section>

          {/* ── TOASTS ───────────────────────────────────────── */}
          <Section
            id="toasts"
            title="Toast Notifications"
            description="Click a button to fire a live toast in the bottom-right corner."
          >
            <DemoBlock label="Trigger Toasts">
              <Button
                variant="outline"
                icon={<CheckCircle2 size={15} className="text-success" />}
                onClick={() => toast({ type: 'success', title: 'Service order saved', message: 'WO-2024-0147 has been updated successfully.' })}
              >
                Success Toast
              </Button>
              <Button
                variant="outline"
                icon={<AlertCircle size={15} className="text-danger" />}
                onClick={() => toast({ type: 'error', title: 'Save failed', message: 'Unable to connect to the server. Please try again.' })}
              >
                Error Toast
              </Button>
              <Button
                variant="outline"
                icon={<AlertCircle size={15} className="text-warning" />}
                onClick={() => toast({ type: 'warning', title: 'Service overdue', message: 'Vehicle KA-01-AB-1234 is 2,000 km past the service interval.' })}
              >
                Warning Toast
              </Button>
              <Button
                variant="outline"
                icon={<Info size={15} className="text-info" />}
                onClick={() => toast({ type: 'info', title: 'Sync in progress', message: 'Vehicle records are being synchronised.' })}
              >
                Info Toast
              </Button>
            </DemoBlock>
          </Section>

          {/* ── DIALOGS ──────────────────────────────────────── */}
          <Section
            id="dialogs"
            title="Dialogs"
            description="Accessible modal dialogs with keyboard handling and focus management."
          >
            <DemoBlock label="Open Dialogs">
              <Button onClick={() => setDialogOpen(true)} icon={<FileText size={15} />}>
                Standard Dialog
              </Button>
              <Button
                variant="danger"
                icon={<Trash2 size={15} />}
                onClick={() => setConfirmOpen(true)}
              >
                Confirm Dialog
              </Button>
              <Button
                variant="outline"
                icon={<CheckCircle2 size={15} className="text-success" />}
                onClick={() => setSuccessDialog(true)}
              >
                Success Dialog
              </Button>
            </DemoBlock>

            {/* Standard dialog */}
            <Dialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              title="Edit Vehicle Details"
              description="Update the registration and ownership information for this vehicle."
              size="md"
              actions={
                <>
                  <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button size="sm" onClick={() => { toast({ type: 'success', title: 'Changes saved' }); setDialogOpen(false); }}>
                    Save Changes
                  </Button>
                </>
              }
            >
              <div className="space-y-4">
                <FormField label="Registration Number" htmlFor="dlg-reg" required>
                  <Input id="dlg-reg" defaultValue="KA-01-AB-1234" />
                </FormField>
                <FormField label="Owner Name" htmlFor="dlg-owner">
                  <Input id="dlg-owner" defaultValue="Rajesh Sharma" />
                </FormField>
                <FormField label="Vehicle Type" htmlFor="dlg-type">
                  <Select id="dlg-type" defaultValue="sedan">
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="hatchback">Hatchback</option>
                  </Select>
                </FormField>
              </div>
            </Dialog>

            {/* Confirm dialog */}
            <ConfirmDialog
              open={confirmOpen}
              onClose={() => setConfirmOpen(false)}
              onConfirm={() => { toast({ type: 'success', title: 'Vehicle deleted' }); setConfirmOpen(false); }}
              title="Delete Vehicle?"
              message="This will permanently remove Toyota Camry KA-01-AB-1234 and all associated service records. This action cannot be undone."
              confirmLabel="Delete Vehicle"
              danger
            />

            {/* Success dialog */}
            <Dialog
              open={successDialog}
              onClose={() => setSuccessDialog(false)}
              size="sm"
            >
              <SuccessState
                title="Invoice Generated"
                message="INV-20241021-0042 has been emailed to the customer."
                action={
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSuccessDialog(false)}>Close</Button>
                    <Button size="sm">Download PDF</Button>
                  </div>
                }
              />
            </Dialog>
          </Section>

          {/* ── TABS ─────────────────────────────────────────── */}
          <Section
            id="tabs"
            title="Tabs"
            description="Horizontal navigation tabs in underline and pill variants."
          >
            <div className="card p-5 space-y-6">
              <div>
                <p className="text-overline text-text-muted mb-3 uppercase">Underline Variant</p>
                <Tabs
                  variant="underline"
                  active={tabActive}
                  onChange={setTabActive}
                  tabs={[
                    { id: 'overview',  label: 'Overview',  icon: <LayoutDashboard size={14} /> },
                    { id: 'history',   label: 'History',   icon: <Clock size={14} /> },
                    { id: 'invoices',  label: 'Invoices',  icon: <FileText size={14} /> },
                    { id: 'notes',     label: 'Notes',     icon: <MessageSquare size={14} /> },
                    { id: 'disabled',  label: 'Archived',  disabled: true },
                  ]}
                >
                  <TabPanel id="overview" active={tabActive} className="pt-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-surface-muted rounded-lg text-center">
                        <p className="text-h3 font-bold">24</p>
                        <p className="text-caption text-text-muted">Services</p>
                      </div>
                      <div className="p-3 bg-surface-muted rounded-lg text-center">
                        <p className="text-h3 font-bold">₹1.8L</p>
                        <p className="text-caption text-text-muted">Total Spend</p>
                      </div>
                      <div className="p-3 bg-surface-muted rounded-lg text-center">
                        <p className="text-h3 font-bold">4.8★</p>
                        <p className="text-caption text-text-muted">Rating</p>
                      </div>
                    </div>
                  </TabPanel>
                  <TabPanel id="history" active={tabActive} className="pt-4">
                    <p className="text-body-sm text-text-muted">Service history would appear here.</p>
                  </TabPanel>
                  <TabPanel id="invoices" active={tabActive} className="pt-4">
                    <p className="text-body-sm text-text-muted">Invoice list would appear here.</p>
                  </TabPanel>
                  <TabPanel id="notes" active={tabActive} className="pt-4">
                    <p className="text-body-sm text-text-muted">Notes and remarks would appear here.</p>
                  </TabPanel>
                </Tabs>
              </div>

              <div className="border-t border-border pt-5">
                <p className="text-overline text-text-muted mb-3 uppercase">Pill Variant</p>
                <Tabs
                  variant="pill"
                  size="sm"
                  active={tabPill}
                  onChange={setTabPill}
                  tabs={[
                    { id: 'all',       label: 'All' },
                    { id: 'open',      label: 'Open' },
                    { id: 'completed', label: 'Completed' },
                    { id: 'cancelled', label: 'Cancelled' },
                  ]}
                />
              </div>
            </div>
          </Section>

          {/* ── NAVIGATION ───────────────────────────────────── */}
          <Section
            id="navigation"
            title="Navigation Components"
            description="Breadcrumbs, dropdown menus, and tooltips."
          >
            <DemoBlock label="Breadcrumbs">
              <div className="flex flex-col gap-3 w-full">
                <Breadcrumbs
                  items={[
                    { label: 'Dashboard', href: '#' },
                    { label: 'Vehicles', href: '#' },
                    { label: 'Toyota Camry' },
                  ]}
                />
                <Breadcrumbs
                  items={[
                    { label: 'Workshop', href: '#' },
                    { label: 'Work Orders', href: '#' },
                    { label: 'WO-2024-0147', href: '#' },
                    { label: 'Edit' },
                  ]}
                />
              </div>
            </DemoBlock>

            <DemoBlock label="Dropdown Menus">
              <Dropdown
                trigger={<DropdownTrigger label="Actions" icon={<Zap size={15} />} />}
                items={[
                  { label: 'Edit Vehicle',      icon: <Edit2 size={15} />,    onClick: () => {} },
                  { label: 'View History',       icon: <Clock size={15} />,    onClick: () => {} },
                  { label: 'Generate Invoice',   icon: <FileText size={15} />, onClick: () => {} },
                  { divider: true },
                  { label: 'Delete Vehicle',     icon: <Trash2 size={15} />,   onClick: () => {}, danger: true },
                ]}
              />
              <Dropdown
                align="right"
                trigger={
                  <Button iconOnly icon={<MoreVertical size={18} />} variant="ghost" aria-label="More options" />
                }
                items={[
                  { label: 'Mark as Complete', icon: <CheckCircle2 size={15} /> },
                  { label: 'Assign Technician', icon: <User size={15} /> },
                  { divider: true },
                  { label: 'Archive',           icon: <Package size={15} />, disabled: true },
                  { label: 'Remove',            icon: <Trash2 size={15} />, danger: true },
                ]}
              />
            </DemoBlock>

            <DemoBlock label="Tooltips">
              <Tooltip content="Add a new vehicle to the fleet" side="top">
                <Button icon={<Plus size={15} />}>Add Vehicle</Button>
              </Tooltip>
              <Tooltip content="Filter by status or date range" side="bottom">
                <Button variant="outline" icon={<Filter size={15} />}>Filter</Button>
              </Tooltip>
              <Tooltip content="Export as CSV or PDF" side="right">
                <Button variant="ghost" iconOnly icon={<Download size={18} />} aria-label="Export" />
              </Tooltip>
              <Tooltip content="View detailed analytics" side="left">
                <Button variant="secondary" icon={<BarChart2 size={15} />}>Analytics</Button>
              </Tooltip>
            </DemoBlock>
          </Section>

          {/* ── PAGINATION ───────────────────────────────────── */}
          <Section
            id="pagination"
            title="Pagination"
            description="Page navigation with smart ellipsis."
          >
            <div className="card p-5 space-y-6">
              <div>
                <p className="text-overline text-text-muted mb-3 uppercase">Standard (page {page} of 12)</p>
                <Pagination page={page} totalPages={12} onChange={setPage} />
              </div>
              <div className="border-t border-border pt-5">
                <p className="text-overline text-text-muted mb-3 uppercase">Short (5 pages)</p>
                <Pagination page={2} totalPages={5} onChange={() => {}} />
              </div>
              <div className="border-t border-border pt-5">
                <p className="text-overline text-text-muted mb-3 uppercase">Single page (hidden)</p>
                <p className="text-caption text-text-muted italic">Pagination is hidden when totalPages ≤ 1</p>
                <Pagination page={1} totalPages={1} onChange={() => {}} />
              </div>
            </div>
          </Section>

          {/* Footer */}
          <footer className="border-t border-border pt-8 pb-4 text-center">
            <p className="text-caption text-text-muted">
              AutoCare Pro Design System v1.0 · Step 2 · Built with React, Vite, Tailwind CSS v3
            </p>
          </footer>

        </main>
      </div>
    </div>
  );
}
