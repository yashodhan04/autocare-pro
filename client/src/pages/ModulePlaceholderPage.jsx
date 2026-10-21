import { useLocation, Link } from 'react-router-dom';
import {
  Users,
  Car,
  Wrench,
  CalendarDays,
  ClipboardList,
  SearchCheck,
  FileText,
  Package,
  Truck,
  ShoppingCart,
  Receipt,
  CreditCard,
  BarChart2,
  UserCheck,
  Settings,
  User2,
  Clock,
  Database,
  ArrowLeft,
  Palette,
  ExternalLink,
  Code2,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { SectionCard } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';

/**
 * Module metadata mapping directly reflecting docs/PROJECT_PLAN.md.
 */
const MODULE_METADATA = {
  '/app/customers': {
    title: 'Customer Management',
    moduleNumber: 'Module 2',
    icon: Users,
    category: 'Customers',
    description: 'Centralized customer directory, contact details, communication history, and fleet accounts.',
    models: ['Customer — firstName, lastName, email, phone, address, notes, createdAt'],
    endpoints: [
      'GET    /api/v1/customers',
      'GET    /api/v1/customers/:id',
      'POST   /api/v1/customers',
      'PATCH  /api/v1/customers/:id',
      'DELETE /api/v1/customers/:id',
      'GET    /api/v1/customers/:id/vehicles',
    ],
    plannedFeatures: [
      'Customer profile creation and editing modal forms',
      'Full-text search, phone number lookup, and pagination',
      'Vehicle association and multi-vehicle ownership tracking',
      'Customer service history and spent expenditure records',
    ],
  },
  '/app/vehicles': {
    title: 'Vehicle Records',
    moduleNumber: 'Module 3',
    icon: Car,
    category: 'Customers',
    description: 'Vehicle registry, VIN decoding, registration plate search, and maintenance lifecycle logs.',
    models: ['Vehicle — make, model, year, vin, registration, colour, owner (ref: Customer), mileage'],
    endpoints: [
      'GET    /api/v1/vehicles',
      'GET    /api/v1/vehicles/:id',
      'POST   /api/v1/vehicles',
      'PATCH  /api/v1/vehicles/:id',
      'DELETE /api/v1/vehicles/:id',
      'GET    /api/v1/vehicles/:id/service-history',
    ],
    plannedFeatures: [
      'Vehicle registration with VIN validation',
      'Linking vehicles to customer profiles',
      'Odometer mileage logging and service intervals',
      'Historical repair timeline and inspection reports',
    ],
  },
  '/app/services': {
    title: 'Services Catalogue',
    moduleNumber: 'Module 5',
    icon: Wrench,
    category: 'Workshop',
    description: 'Standard workshop service packages, scheduled maintenance templates, and standard hourly rates.',
    models: ['ServicePackage — name, category, standardHours, baseLabourRate, recommendedParts[]'],
    endpoints: [
      'GET    /api/v1/services',
      'POST   /api/v1/services',
      'PATCH  /api/v1/services/:id',
      'DELETE /api/v1/services/:id',
    ],
    plannedFeatures: [
      'Service catalog (Oil change, brake inspection, wheel alignment, major service)',
      'Standard labour time calculation and price matrix',
      'Required parts bundling for job card autofill',
    ],
  },
  '/app/appointments': {
    title: 'Appointments & Scheduling',
    moduleNumber: 'Module 4',
    icon: CalendarDays,
    category: 'Workshop',
    description: 'Service appointment scheduling, bay allocation calendar, advisor assignment, and booking queue.',
    models: ['Appointment — vehicle, customer, advisor, scheduledAt, status, notes'],
    endpoints: [
      'GET    /api/v1/appointments',
      'GET    /api/v1/appointments/:id',
      'POST   /api/v1/appointments',
      'PATCH  /api/v1/appointments/:id',
      'DELETE /api/v1/appointments/:id',
    ],
    plannedFeatures: [
      'Interactive day, week, and month booking calendar',
      'Appointment status tracking (Pending, Confirmed, In Progress, Completed, Cancelled)',
      'Customer intake queue and advisor assignment',
      'One-click conversion from appointment to active Work Order',
    ],
  },
  '/app/service-jobs': {
    title: 'Service Jobs & Work Orders',
    moduleNumber: 'Module 5',
    icon: ClipboardList,
    category: 'Workshop',
    description: 'Shop-floor job cards, task assignment, technician punch clock, and billable hours tracking.',
    models: ['WorkOrder — appointment, vehicle, technician, tasks[], parts[], status, totalLabour, totalParts'],
    endpoints: [
      'GET    /api/v1/work-orders',
      'GET    /api/v1/work-orders/:id',
      'POST   /api/v1/work-orders',
      'PATCH  /api/v1/work-orders/:id',
      'POST   /api/v1/work-orders/:id/tasks',
      'PATCH  /api/v1/work-orders/:id/tasks/:taskId',
    ],
    plannedFeatures: [
      'Digital job cards with live state (Open, In Progress, Awaiting Parts, Done)',
      'Technician assignment and labour time recording',
      'Line-item spare parts checkout from inventory',
      'Completed work order handover to Invoicing',
    ],
  },
  '/app/inspections': {
    title: 'Vehicle Inspections',
    moduleNumber: 'Module 5',
    icon: SearchCheck,
    category: 'Workshop',
    description: 'Multi-point digital inspection checklists (brakes, tires, fluids, suspension) and defect notes.',
    models: ['Inspection — workOrder, vehicle, inspector, checklistItems[], overallCondition, photos[]'],
    endpoints: [
      'GET    /api/v1/inspections',
      'POST   /api/v1/inspections',
      'GET    /api/v1/inspections/:id',
    ],
    plannedFeatures: [
      'Interactive 50-point vehicle health checklist',
      'Pass / Advisory / Fail item categorization',
      'Technician inspection sign-off notes',
    ],
  },
  '/app/estimates': {
    title: 'Cost Estimates',
    moduleNumber: 'Module 5',
    icon: FileText,
    category: 'Workshop',
    description: 'Pre-service cost estimations, labour rate calculations, and customer approval workflows.',
    models: ['Estimate — customer, vehicle, lineItems[], totalEstimated, approvedByCustomer, validUntil'],
    endpoints: [
      'GET    /api/v1/estimates',
      'POST   /api/v1/estimates',
      'PATCH  /api/v1/estimates/:id/approve',
    ],
    plannedFeatures: [
      'Itemized cost breakdown of anticipated labour and materials',
      'Customer quote generation and print preview',
      'Conversion of approved estimates directly into job cards',
    ],
  },
  '/app/inventory': {
    title: 'Inventory & Parts Catalogue',
    moduleNumber: 'Module 6',
    icon: Package,
    category: 'Inventory',
    description: 'Spare parts stock management, SKU numbering, category organization, and low-stock reorder triggers.',
    models: ['Part — name, sku, category, quantity, reorderLevel, unitCost, unitPrice, supplier'],
    endpoints: [
      'GET    /api/v1/inventory',
      'GET    /api/v1/inventory/:id',
      'POST   /api/v1/inventory',
      'PATCH  /api/v1/inventory/:id',
      'DELETE /api/v1/inventory/:id',
      'GET    /api/v1/inventory/low-stock',
    ],
    plannedFeatures: [
      'Part catalogue with SKU search, category filter, and shelf location',
      'Automated low-stock threshold alerts',
      'Real-time deduction when parts are added to work orders',
      'Cost price vs selling price margin calculation',
    ],
  },
  '/app/suppliers': {
    title: 'Suppliers Directory',
    moduleNumber: 'Module 6',
    icon: Truck,
    category: 'Inventory',
    description: 'Parts vendor accounts, supplier contacts, payment terms, and delivery lead times.',
    models: ['Supplier — companyName, contactName, email, phone, address, paymentTerms'],
    endpoints: [
      'GET    /api/v1/suppliers',
      'POST   /api/v1/suppliers',
      'PATCH  /api/v1/suppliers/:id',
    ],
    plannedFeatures: [
      'Supplier contact directory and purchase history',
      'Preferred vendor tagging per part category',
      'Supplier order lead time tracking',
    ],
  },
  '/app/purchase-orders': {
    title: 'Purchase Orders',
    moduleNumber: 'Module 6',
    icon: ShoppingCart,
    category: 'Inventory',
    description: 'Stock replenishment orders, supplier purchase orders, and goods-received verification.',
    models: ['PurchaseOrder — supplier, items[], status, totalAmount, orderedAt, receivedAt'],
    endpoints: [
      'GET    /api/v1/purchase-orders',
      'POST   /api/v1/purchase-orders',
      'PATCH  /api/v1/purchase-orders/:id/receive',
    ],
    plannedFeatures: [
      'PO creation from low-stock recommendations',
      'Goods receipt check-in and inventory increment',
      'Supplier invoice matching',
    ],
  },
  '/app/invoices': {
    title: 'Invoices & Billing',
    moduleNumber: 'Module 7',
    icon: Receipt,
    category: 'Finance',
    description: 'Customer invoices, tax calculations, discounts, payment records, and PDF export preview.',
    models: ['Invoice — workOrder, customer, lineItems[], subtotal, tax, total, status, dueDate'],
    endpoints: [
      'GET    /api/v1/invoices',
      'GET    /api/v1/invoices/:id',
      'POST   /api/v1/invoices',
      'PATCH  /api/v1/invoices/:id',
      'POST   /api/v1/invoices/:id/mark-paid',
    ],
    plannedFeatures: [
      'Automatic invoice creation upon work order completion',
      'Tax calculation, discounts, and payment terms',
      'Status tracking (Draft, Sent, Paid, Overdue)',
      'Printable invoice layout',
    ],
  },
  '/app/payments': {
    title: 'Payment Records',
    moduleNumber: 'Module 7',
    icon: CreditCard,
    category: 'Finance',
    description: 'Transaction log, payment method recording (Cash, Card, Transfer), and outstanding balances.',
    models: ['Payment — invoice, customer, amount, method, transactionRef, paidAt'],
    endpoints: [
      'GET    /api/v1/payments',
      'POST   /api/v1/payments',
    ],
    plannedFeatures: [
      'Manual recording of received payments against invoices',
      'Partial payments and balance tracking',
      'Daily settlement and cashier totals',
    ],
  },
  '/app/reports': {
    title: 'Reports & Analytics',
    moduleNumber: 'Module 8',
    icon: BarChart2,
    category: 'Management',
    description: 'Workshop business intelligence, revenue metrics, service volume trends, and technician productivity.',
    models: ['Analytics — MongoDB aggregation pipelines over WorkOrders, Invoices, and Appointments'],
    endpoints: [
      'GET /api/v1/reports/summary',
      'GET /api/v1/reports/revenue?period=monthly',
      'GET /api/v1/reports/appointments?period=weekly',
    ],
    plannedFeatures: [
      'Monthly revenue trend line charts (powered by Recharts)',
      'Service volume and job completion distribution (Recharts bar charts)',
      'Parts turnover and inventory valuation reports',
      'Mechanic billable hours and efficiency metrics',
    ],
  },
  '/app/employees': {
    title: 'Employees & Technicians',
    moduleNumber: 'Module 10',
    icon: UserCheck,
    category: 'Management',
    description: 'Workshop staff directory, service advisor assignments, technician skill tiers, and bay allocations.',
    models: ['Employee — name, email, role, specialty, hourlyRate, active'],
    endpoints: [
      'GET    /api/v1/employees',
      'POST   /api/v1/employees',
      'PATCH  /api/v1/employees/:id',
    ],
    plannedFeatures: [
      'Staff roster with role assignment (Technician, Service Advisor, Parts Manager, Admin)',
      'Technician job allocation and bay pairing',
      'Productivity and completed job history',
    ],
  },
  '/app/settings': {
    title: 'System Settings',
    moduleNumber: 'Module 10',
    icon: Settings,
    category: 'Management',
    description: 'Workshop operating parameters, business profile, tax rates, standard labour charges, and system preferences.',
    models: ['Setting — workshopName, address, taxRate, standardLabourRate, currency, businessHours'],
    endpoints: [
      'GET   /api/v1/settings',
      'PATCH /api/v1/settings',
    ],
    plannedFeatures: [
      'Workshop branding and contact info for invoice headers',
      'Default currency and tax percentage configuration',
      'Operating hours and service bay capacity definitions',
    ],
  },
  '/app/profile': {
    title: 'User Profile',
    moduleNumber: 'Module 1',
    icon: User2,
    category: 'Account',
    description: 'Current user credentials, password change, and session preferences.',
    models: ['User — name, email, passwordHash, role, isActive'],
    endpoints: [
      'GET   /api/v1/auth/me',
      'PATCH /api/v1/auth/change-password',
    ],
    plannedFeatures: [
      'User profile information and contact details',
      'Password update with current password verification',
      'Notification preference toggles',
    ],
  },
};

export default function ModulePlaceholderPage() {
  const { pathname } = useLocation();
  const info = MODULE_METADATA[pathname] || {
    title: 'Module Under Development',
    moduleNumber: 'Future Step',
    icon: Clock,
    category: 'Application',
    description: 'This business module is scheduled for implementation in upcoming development steps.',
    models: ['Schemas defined in docs/PROJECT_PLAN.md'],
    endpoints: ['Routes mapped under /api/v1/'],
    plannedFeatures: ['Feature specifications documented in project plan.'],
  };

  const Icon = info.icon;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <PageHeader
        title={info.title}
        description={info.description}
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="pill" color="neutral">
              {info.category}
            </Badge>
            <Badge variant="outline" color="lime" dot>
              {info.moduleNumber}: Under Development
            </Badge>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/app/dashboard">
              <Button variant="secondary" size="sm">
                <ArrowLeft size={15} aria-hidden="true" />
                <span>Return to Dashboard</span>
              </Button>
            </Link>
            <Link to="/design-system" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <Palette size={15} aria-hidden="true" />
                <span>Design System</span>
                <ExternalLink size={12} className="text-text-muted" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── Status Banner ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-charcoal flex items-center justify-center shrink-0 text-brand-lime">
            <Icon size={24} aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-text-primary">
              {info.title} — Implementation Roadmap
            </h2>
            <p className="text-caption text-text-muted max-w-2xl">
              This module route is registered in the AutoCare Pro application shell.
              The backend MongoDB collection, controller handlers, and interactive UI views are documented below
              and scheduled for implementation in the next phase.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-caption font-mono text-text-muted bg-surface-muted px-3 py-1.5 rounded-xl border border-border">
            Route: {pathname}
          </span>
        </div>
      </div>

      {/* ── Content Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Planned Features */}
        <SectionCard
          title="Planned Features & User Interface"
          subtitle={`Capabilities to be delivered when ${info.title} is connected`}
          className="lg:col-span-2"
        >
          <ul className="space-y-3">
            {info.plannedFeatures.map((feat, i) => (
              <li key={i} className="flex items-start gap-3 text-body-sm text-text-primary">
                <div className="w-5 h-5 rounded-md bg-brand-lime/20 flex items-center justify-center shrink-0 mt-0.5 text-brand-charcoal">
                  <CheckCircle2 size={13} className="text-brand-charcoal" aria-hidden="true" />
                </div>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* Database & Architecture */}
        <div className="space-y-6">
          <SectionCard
            title={
              <div className="flex items-center gap-2">
                <Database size={16} className="text-text-muted" aria-hidden="true" />
                <span>Target Mongoose Schema</span>
              </div>
            }
            subtitle="MongoDB collection model definition"
          >
            <div className="space-y-2">
              {info.models.map((model, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-surface-muted font-mono text-caption text-text-primary border border-border"
                >
                  {model}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title={
              <div className="flex items-center gap-2">
                <Code2 size={16} className="text-text-muted" aria-hidden="true" />
                <span>Planned REST API Endpoints</span>
              </div>
            }
            subtitle="Express 5 route bindings"
          >
            <div className="space-y-1.5">
              {info.endpoints.map((ep, i) => (
                <div
                  key={i}
                  className="px-2.5 py-1.5 rounded-lg bg-brand-charcoal text-white font-mono text-[11px] flex items-center justify-between"
                >
                  <span>{ep}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
