const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
export const formatMoney = (n) => money.format(Number(n) || 0);
export const formatNumber = (n) => new Intl.NumberFormat('en-IN').format(Number(n) || 0);

export const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const formatDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

/** snake_case -> "Title Case" */
export const humanize = (s) => String(s ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Local YYYY-MM-DD for <input type="date"> */
export const toDateInput = (d = new Date()) => new Date(d).toLocaleDateString('en-CA');
export const toDateTimeInput = (d) => {
  const x = new Date(d);
  const p = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
};

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

export const ROLE_LABELS = {
  super_admin: 'Super Admin', workshop_admin: 'Workshop Admin', service_advisor: 'Service Advisor',
  mechanic: 'Mechanic', inventory_manager: 'Inventory Manager', cashier: 'Cashier', customer: 'Customer',
};

const VARIANTS = {
  // appointments / generic
  pending: 'warning', confirmed: 'success', rejected: 'danger', cancelled: 'neutral', checked_in: 'info', completed: 'success', no_show: 'danger',
  // jobs
  inspection: 'info', awaiting_estimate: 'warning', awaiting_approval: 'warning', approved: 'success', in_progress: 'lime',
  quality_check: 'info', invoiced: 'info', delivered: 'success',
  // estimates
  draft: 'neutral', pending_approval: 'warning', superseded: 'neutral',
  // inventory / PO
  in_stock: 'success', low_stock: 'warning', out_of_stock: 'danger', ordered: 'info', partially_received: 'warning', received: 'success',
  // invoices
  unpaid: 'danger', partial: 'warning', paid: 'success', void: 'neutral',
  // priority
  low: 'neutral', normal: 'info', high: 'warning', urgent: 'danger',
  // inspection
  pass: 'success', attention: 'warning', fail: 'danger',
  // misc
  active: 'success', inactive: 'neutral', issued: 'success', requested: 'warning',
};
export const statusVariant = (s) => VARIANTS[s] ?? 'default';
