/**
 * nav.config.js — AutoCare Pro navigation structure.
 *
 * Each item: { id, label, path, icon, roles? } — `roles` limits who sees (and may open) the page.
 * Omit `roles` for "every signed-in user". The same table drives route guards in App.jsx,
 * so the sidebar can never show a link the router would refuse.
 */

import {
  LayoutDashboard, Users, Car, Wrench, CalendarDays, ClipboardList, SearchCheck, FileText, Package, Truck,
  ShoppingCart, Receipt, CreditCard, BarChart2, UserCheck, HardHat, BellRing, Star, ScrollText, UserCircle,
} from 'lucide-react';

const SA = 'super_admin', WA = 'workshop_admin', ADV = 'service_advisor', MECH = 'mechanic', INV = 'inventory_manager', CASH = 'cashier', CUST = 'customer';
export const ADMINS = [SA, WA];

export const NAV_GROUPS = [
  {
    groupLabel: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
      { id: 'workspace', label: 'My Workspace', path: '/app/workspace', icon: HardHat, roles: [MECH] },
    ],
  },
  {
    groupLabel: 'Customers',
    items: [
      { id: 'customers', label: 'Customers', path: '/app/customers', icon: Users, roles: [...ADMINS, ADV, CASH] },
      { id: 'vehicles', label: 'Vehicles', path: '/app/vehicles', icon: Car },
      { id: 'reminders', label: 'Reminders', path: '/app/reminders', icon: BellRing, roles: [...ADMINS, ADV, CUST] },
    ],
  },
  {
    groupLabel: 'Workshop',
    items: [
      { id: 'services', label: 'Services', path: '/app/services', icon: Wrench },
      { id: 'appointments', label: 'Appointments', path: '/app/appointments', icon: CalendarDays, roles: [...ADMINS, ADV, CASH, CUST] },
      { id: 'service-jobs', label: 'Service Jobs', path: '/app/service-jobs', icon: ClipboardList },
      { id: 'inspections', label: 'Inspections', path: '/app/inspections', icon: SearchCheck, roles: [...ADMINS, ADV, MECH, CUST] },
      { id: 'estimates', label: 'Estimates', path: '/app/estimates', icon: FileText, roles: [...ADMINS, ADV, MECH, CASH, CUST] },
    ],
  },
  {
    groupLabel: 'Inventory',
    items: [
      { id: 'inventory', label: 'Inventory', path: '/app/inventory', icon: Package, roles: [...ADMINS, ADV, MECH, INV, CASH] },
      { id: 'suppliers', label: 'Suppliers', path: '/app/suppliers', icon: Truck, roles: [...ADMINS, INV] },
      { id: 'purchase-orders', label: 'Purchase Orders', path: '/app/purchase-orders', icon: ShoppingCart, roles: [...ADMINS, INV] },
    ],
  },
  {
    groupLabel: 'Finance',
    items: [
      { id: 'invoices', label: 'Invoices', path: '/app/invoices', icon: Receipt, roles: [...ADMINS, ADV, CASH, CUST] },
      { id: 'payments', label: 'Payments', path: '/app/payments', icon: CreditCard, roles: [...ADMINS, ADV, CASH, CUST] },
    ],
  },
  {
    groupLabel: 'Management',
    items: [
      { id: 'reports', label: 'Reports', path: '/app/reports', icon: BarChart2, roles: [...ADMINS, ADV, INV, CASH] },
      { id: 'employees', label: 'Staff & Users', path: '/app/employees', icon: UserCheck, roles: ADMINS },
      { id: 'reviews', label: 'Reviews', path: '/app/reviews', icon: Star },
      { id: 'audit', label: 'Audit Log', path: '/app/audit', icon: ScrollText, roles: ADMINS },
    ],
  },
  {
    groupLabel: 'Account',
    items: [
      { id: 'notifications', label: 'Notifications', path: '/app/notifications', icon: BellRing },
      { id: 'profile', label: 'My Profile', path: '/app/profile', icon: UserCircle },
    ],
  },
];

/** Groups/items visible to a role (empty groups removed). */
export function navForRole(role) {
  return NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || i.roles.includes(role)) }))
    .filter((g) => g.items.length);
}

export const rolesFor = (id) => NAV_GROUPS.flatMap((g) => g.items).find((i) => i.id === id)?.roles;
