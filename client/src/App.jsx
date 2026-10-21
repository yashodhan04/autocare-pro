import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import { RequireAuth, GuestOnly } from './components/common/RequireAuth.jsx';
import { rolesFor } from './config/nav.config.js';
import LandingPage from './pages/public/LandingPage.jsx';
const LabDemoPage = lazy(() => import('./pages/public/LabDemoPage.jsx'));
const DesignSystemPage = lazy(() => import('./pages/DesignSystemPage.jsx'));
import NotFoundPage from './pages/NotFoundPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const CustomersPage = lazy(() => import('./pages/CustomersPage.jsx'));
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage.jsx'));
const VehiclesPage = lazy(() => import('./pages/VehiclesPage.jsx'));
const VehicleDetailPage = lazy(() => import('./pages/VehicleDetailPage.jsx'));
const ServicesPage = lazy(() => import('./pages/ServicesPage.jsx'));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage.jsx'));
const JobsPage = lazy(() => import('./pages/JobsPage.jsx'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage.jsx'));
const InspectionsPage = lazy(() => import('./pages/InspectionsPage.jsx'));
const EstimatesPage = lazy(() => import('./pages/EstimatesPage.jsx'));
const EstimateEditorPage = lazy(() => import('./pages/EstimateEditorPage.jsx'));
const EstimateDetailPage = lazy(() => import('./pages/EstimateDetailPage.jsx'));
const MechanicWorkspacePage = lazy(() => import('./pages/MechanicWorkspacePage.jsx'));
const InventoryPage = lazy(() => import('./pages/InventoryPage.jsx'));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage.jsx'));
const SupplierDetailPage = lazy(() => import('./pages/SupplierDetailPage.jsx'));
const PurchaseOrdersPage = lazy(() => import('./pages/PurchaseOrdersPage.jsx'));
const PurchaseOrderDetailPage = lazy(() => import('./pages/PurchaseOrderDetailPage.jsx'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage.jsx'));
const InvoiceDetailPage = lazy(() => import('./pages/InvoiceDetailPage.jsx'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage.jsx'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage.jsx'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage.jsx'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const RemindersPage = lazy(() => import('./pages/RemindersPage.jsx'));

/** Route guarded by the same role table that drives the sidebar (config/nav.config.js). */
const guarded = (id, element, roles = rolesFor(id)) => <RequireAuth roles={roles}>{element}</RequireAuth>;
const ESTIMATE_WRITERS = ['super_admin', 'workshop_admin', 'service_advisor'];

/**
 * App — router.
 *   /                public landing        /login /register /forgot-password /reset-password
 *   /lab             coursework demos      /design-system  UI component showcase
 *   /app/*           authenticated shell; each page is role-guarded
 */
export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-8" role="status" aria-label="Loading page"><div className="skeleton h-8 w-56 rounded-lg" /></div>}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/lab" element={<LabDemoPage />} />
        <Route path="/design-system" element={<DesignSystemPage />} />
        <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
        <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="workspace" element={guarded('workspace', <MechanicWorkspacePage />)} />

          <Route path="customers" element={guarded('customers', <CustomersPage />)} />
          <Route path="customers/:id" element={guarded('customers', <CustomerDetailPage />)} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="reminders" element={guarded('reminders', <RemindersPage />)} />

          <Route path="services" element={<ServicesPage />} />
          <Route path="appointments" element={guarded('appointments', <AppointmentsPage />)} />
          <Route path="service-jobs" element={<JobsPage />} />
          <Route path="service-jobs/:id" element={<JobDetailPage />} />
          <Route path="inspections" element={guarded('inspections', <InspectionsPage />)} />
          <Route path="estimates" element={guarded('estimates', <EstimatesPage />)} />
          <Route path="estimates/new" element={guarded('estimates', <EstimateEditorPage />, ESTIMATE_WRITERS)} />
          <Route path="estimates/:id" element={guarded('estimates', <EstimateDetailPage />)} />
          <Route path="estimates/:id/edit" element={guarded('estimates', <EstimateEditorPage />, ESTIMATE_WRITERS)} />

          <Route path="inventory" element={guarded('inventory', <InventoryPage />)} />
          <Route path="suppliers" element={guarded('suppliers', <SuppliersPage />)} />
          <Route path="suppliers/:id" element={guarded('suppliers', <SupplierDetailPage />)} />
          <Route path="purchase-orders" element={guarded('purchase-orders', <PurchaseOrdersPage />)} />
          <Route path="purchase-orders/:id" element={guarded('purchase-orders', <PurchaseOrderDetailPage />)} />

          <Route path="invoices" element={guarded('invoices', <InvoicesPage />)} />
          <Route path="invoices/:id" element={guarded('invoices', <InvoiceDetailPage />)} />
          <Route path="payments" element={guarded('payments', <PaymentsPage />)} />

          <Route path="reports" element={guarded('reports', <ReportsPage />)} />
          <Route path="employees" element={guarded('employees', <EmployeesPage />)} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="audit" element={guarded('audit', <AuditLogPage />)} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
