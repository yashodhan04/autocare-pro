import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ModulePlaceholderPage from './pages/ModulePlaceholderPage.jsx';
import DesignSystemPage from './pages/DesignSystemPage.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

/**
 * App — Root router configuration for AutoCare Pro.
 *
 * Routing Architecture:
 *   /                     — Public landing & scaffold verification page
 *   /design-system        — Living UI Design System component showcase
 *   /app                  — Application shell layout (Sidebar + TopNav + Content)
 *     /app/dashboard      — Workshop operations dashboard
 *     /app/customers      — Customer management (Module 2)
 *     /app/vehicles       — Vehicle records (Module 3)
 *     /app/services       — Services catalogue (Module 5)
 *     /app/appointments   — Appointments & scheduling (Module 4)
 *     /app/service-jobs   — Work orders & job cards (Module 5)
 *     /app/inspections    — Vehicle health inspections (Module 5)
 *     /app/estimates      — Cost estimates (Module 5)
 *     /app/inventory      — Parts inventory (Module 6)
 *     /app/suppliers      — Suppliers directory (Module 6)
 *     /app/purchase-orders— Purchase orders (Module 6)
 *     /app/invoices       — Invoices & billing (Module 7)
 *     /app/payments       — Payment records (Module 7)
 *     /app/reports        — Reports & analytics (Module 8)
 *     /app/employees      — Staff & technicians (Module 10)
 *     /app/settings       — System settings (Module 10)
 *     /app/profile        — User profile (Module 1)
 *   *                     — Branded 404 Not Found page
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing */}
        <Route path="/" element={<PlaceholderPage />} />

        {/* Design System Showcase */}
        <Route path="/design-system" element={<DesignSystemPage />} />

        {/* Authenticated Application Shell */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Module Placeholder Routes */}
          <Route path="customers" element={<ModulePlaceholderPage />} />
          <Route path="vehicles" element={<ModulePlaceholderPage />} />
          <Route path="services" element={<ModulePlaceholderPage />} />
          <Route path="appointments" element={<ModulePlaceholderPage />} />
          <Route path="service-jobs" element={<ModulePlaceholderPage />} />
          <Route path="inspections" element={<ModulePlaceholderPage />} />
          <Route path="estimates" element={<ModulePlaceholderPage />} />
          <Route path="inventory" element={<ModulePlaceholderPage />} />
          <Route path="suppliers" element={<ModulePlaceholderPage />} />
          <Route path="purchase-orders" element={<ModulePlaceholderPage />} />
          <Route path="invoices" element={<ModulePlaceholderPage />} />
          <Route path="payments" element={<ModulePlaceholderPage />} />
          <Route path="reports" element={<ModulePlaceholderPage />} />
          <Route path="employees" element={<ModulePlaceholderPage />} />
          <Route path="settings" element={<ModulePlaceholderPage />} />
          <Route path="profile" element={<ModulePlaceholderPage />} />

          {/* Catch-all within /app */}
          <Route path="*" element={<ModulePlaceholderPage />} />
        </Route>

        {/* Global 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
