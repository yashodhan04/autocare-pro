import { humanize } from '../utils/format.js';

const opts = (arr) => arr.map((v) => ({ value: v, label: humanize(v) }));

export const FUEL_OPTIONS = opts(['petrol', 'diesel', 'cng', 'electric', 'hybrid']);
export const VEHICLE_TYPE_OPTIONS = opts(['car', 'suv', 'van', 'truck', 'bike']);
export const SERVICE_CATEGORY_OPTIONS = opts(['general', 'oil', 'brakes', 'tyres', 'battery', 'ac', 'engine', 'electrical', 'body', 'other']);
export const PART_CATEGORY_OPTIONS = opts(['engine', 'brakes', 'tyres', 'battery', 'filters', 'fluids', 'electrical', 'body', 'suspension', 'accessories', 'other']);
export const PRIORITY_OPTIONS = opts(['low', 'normal', 'high', 'urgent']);
export const JOB_STATUS_OPTIONS = opts(['checked_in', 'inspection', 'awaiting_estimate', 'awaiting_approval', 'approved', 'in_progress', 'quality_check', 'completed', 'invoiced', 'delivered', 'cancelled']);
export const APPT_STATUS_OPTIONS = opts(['pending', 'confirmed', 'rejected', 'cancelled', 'checked_in', 'completed', 'no_show']);
export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card (manual entry)' }, { value: 'upi', label: 'UPI (manual entry)' },
  { value: 'bank_transfer', label: 'Bank transfer' }, { value: 'test', label: 'TEST transaction (simulated)' },
];
export const ROLE_OPTIONS = opts(['super_admin', 'workshop_admin', 'service_advisor', 'mechanic', 'inventory_manager', 'cashier', 'customer']).map((o) => ({ ...o, label: o.label }));
export const STAFF_ROLE_OPTIONS = ROLE_OPTIONS.filter((o) => o.value !== 'customer');
export const PHONE_PATTERN = /^[+\d][\d\s-]{6,17}$/;
