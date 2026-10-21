/**
 * nav.config.js — AutoCare Pro navigation structure.
 *
 * Each group has a label and an array of nav items.
 * Each item: { id, label, path, icon, badge? }
 *
 * Icons are Lucide React component references — import them here
 * and export the full config so Sidebar can consume it without
 * knowing about the icon library directly.
 */

import {
  LayoutDashboard,
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
} from 'lucide-react';

/** @type {Array<{ groupLabel: string, items: Array<NavItem> }>} */
export const NAV_GROUPS = [
  {
    groupLabel: 'Overview',
    items: [
      {
        id:    'dashboard',
        label: 'Dashboard',
        path:  '/app/dashboard',
        icon:  LayoutDashboard,
      },
    ],
  },
  {
    groupLabel: 'Customers',
    items: [
      { id: 'customers', label: 'Customers',  path: '/app/customers', icon: Users },
      { id: 'vehicles',  label: 'Vehicles',   path: '/app/vehicles',  icon: Car  },
    ],
  },
  {
    groupLabel: 'Workshop',
    items: [
      { id: 'services',      label: 'Services',      path: '/app/services',      icon: Wrench         },
      { id: 'appointments',  label: 'Appointments',  path: '/app/appointments',  icon: CalendarDays   },
      { id: 'service-jobs',  label: 'Service Jobs',  path: '/app/service-jobs',  icon: ClipboardList  },
      { id: 'inspections',   label: 'Inspections',   path: '/app/inspections',   icon: SearchCheck    },
      { id: 'estimates',     label: 'Estimates',     path: '/app/estimates',     icon: FileText       },
    ],
  },
  {
    groupLabel: 'Inventory',
    items: [
      { id: 'inventory',        label: 'Inventory',       path: '/app/inventory',        icon: Package      },
      { id: 'suppliers',        label: 'Suppliers',        path: '/app/suppliers',        icon: Truck        },
      { id: 'purchase-orders',  label: 'Purchase Orders',  path: '/app/purchase-orders',  icon: ShoppingCart },
    ],
  },
  {
    groupLabel: 'Finance',
    items: [
      { id: 'invoices',  label: 'Invoices',  path: '/app/invoices',  icon: Receipt    },
      { id: 'payments',  label: 'Payments',  path: '/app/payments',  icon: CreditCard },
    ],
  },
  {
    groupLabel: 'Management',
    items: [
      { id: 'reports',   label: 'Reports',   path: '/app/reports',   icon: BarChart2  },
      { id: 'employees', label: 'Employees', path: '/app/employees', icon: UserCheck  },
      { id: 'settings',  label: 'Settings',  path: '/app/settings',  icon: Settings   },
    ],
  },
];

