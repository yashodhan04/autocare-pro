export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  WORKSHOP_ADMIN: 'workshop_admin',
  SERVICE_ADVISOR: 'service_advisor',
  MECHANIC: 'mechanic',
  INVENTORY_MANAGER: 'inventory_manager',
  CASHIER: 'cashier',
  CUSTOMER: 'customer',
};

export const ALL_ROLES = Object.values(ROLES);
export const STAFF_ROLES = ALL_ROLES.filter((r) => r !== ROLES.CUSTOMER);
export const ADMINS = [ROLES.SUPER_ADMIN, ROLES.WORKSHOP_ADMIN];
export const ADVISORS = [...ADMINS, ROLES.SERVICE_ADVISOR];
export const STOCK_ROLES = [...ADMINS, ROLES.INVENTORY_MANAGER];

export const VEHICLE_TYPES = ['car', 'suv', 'van', 'truck', 'bike'];
export const FUEL_TYPES = ['petrol', 'diesel', 'cng', 'electric', 'hybrid'];
export const SERVICE_CATEGORIES = ['general', 'oil', 'brakes', 'tyres', 'battery', 'ac', 'engine', 'electrical', 'body', 'other'];
export const PART_CATEGORIES = ['engine', 'brakes', 'tyres', 'battery', 'filters', 'fluids', 'electrical', 'body', 'suspension', 'accessories', 'other'];

export const APPOINTMENT_STATUS = ['pending', 'confirmed', 'rejected', 'cancelled', 'checked_in', 'completed', 'no_show'];
export const BLOCKING_APPT_STATUS = ['pending', 'confirmed'];

export const JOB_STATUS = [
  'checked_in', 'inspection', 'awaiting_estimate', 'awaiting_approval', 'approved',
  'in_progress', 'quality_check', 'completed', 'invoiced', 'delivered', 'cancelled',
];
export const PRIORITIES = ['low', 'normal', 'high', 'urgent'];

export const DEFAULT_CHECKLIST = [
  'Engine oil level', 'Coolant level', 'Brake pads / discs', 'Brake fluid', 'Tyres (tread & pressure)',
  'Battery health', 'Lights & indicators', 'Wipers & washer', 'Suspension', 'Steering', 'Air filter', 'AC performance',
];
