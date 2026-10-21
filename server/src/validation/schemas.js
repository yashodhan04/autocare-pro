/** Zod request schemas — validated server-side on every write endpoint. */
import { z } from 'zod';
import { ALL_ROLES, FUEL_TYPES, PART_CATEGORIES, PRIORITIES, SERVICE_CATEGORIES, VEHICLE_TYPES } from '../config/constants.js';

/** Ids are positive integers; the client sends them as strings from <select>s, so accept both. */
export const recordId = z.union([z.string().regex(/^\d+$/, 'Invalid id'), z.number().int().positive()]).transform(Number);
const str = (max = 200) => z.string().trim().max(max);
const reqStr = (label, max = 200) => z.string({ required_error: `${label} is required` }).trim().min(1, `${label} is required`).max(max);
const optStr = (max = 200) => z.preprocess((v) => (v === '' ? undefined : v), str(max).optional());
const optDate = z.preprocess((v) => (v === '' || v === null ? undefined : v), z.coerce.date().optional());
const num = (label) => z.coerce.number({ invalid_type_error: `${label} must be a number` });
const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const phone = z.string().trim().regex(/^[+\d][\d\s-]{6,17}$/, 'Enter a valid phone number');
export const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

// ── Auth / users ────────────────────────────────────────────
export const registerSchema = z.object({ name: reqStr('Name', 100), email, password, phone });
export const loginSchema = z.object({ email, password: z.string().min(1, 'Password is required') });
export const profileSchema = z.object({ name: reqStr('Name', 100).optional(), phone: phone.optional() });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1, 'Current password is required'), newPassword: password });
export const forgotSchema = z.object({ email });
export const resetSchema = z.object({ token: z.string().min(10), password });
export const createUserSchema = z.object({ name: reqStr('Name', 100), email, password, role: z.enum(ALL_ROLES), phone: phone.optional() });
export const updateUserSchema = z.object({ name: reqStr('Name', 100).optional(), role: z.enum(ALL_ROLES).optional(), isActive: z.boolean().optional(), phone: phone.optional() });

// ── Core records ────────────────────────────────────────────
export const customerSchema = z.object({
  name: reqStr('Name', 100), phone, email: z.preprocess((v) => (v === '' ? undefined : v), email.optional()),
  address: optStr(300), notes: optStr(1000), isActive: z.boolean().optional(),
});

const thisYear = new Date().getFullYear();
export const vehicleSchema = z.object({
  customer: recordId.optional(),
  registrationNumber: reqStr('Registration number', 20).regex(/^[A-Za-z0-9\s-]{3,20}$/, 'Registration number may contain letters, digits, spaces or hyphens'),
  make: reqStr('Make', 50), model: reqStr('Model', 50),
  year: num('Year').int().min(1950, 'Year looks too old').max(thisYear + 1, 'Year is in the future'),
  vehicleType: z.enum(VEHICLE_TYPES).default('car'),
  fuelType: z.enum(FUEL_TYPES),
  vin: z.preprocess((v) => (v === '' ? undefined : v), z.string().trim().regex(/^[A-Za-z0-9]{11,17}$/, 'VIN / chassis number must be 11-17 letters or digits').optional()),
  color: optStr(30),
  odometer: num('Odometer').min(0).default(0),
  isActive: z.boolean().optional(),
});

export const serviceSchema = z.object({
  name: reqStr('Name', 100), description: optStr(600),
  category: z.enum(SERVICE_CATEGORIES).default('general'),
  estimatedPrice: num('Price').min(0),
  estimatedDurationMinutes: num('Duration').int().min(15).max(1440),
  vehicleTypes: z.array(z.enum(VEHICLE_TYPES)).min(1, 'Select at least one vehicle type').default(VEHICLE_TYPES),
  isActive: z.boolean().optional(),
});

// ── Appointments ────────────────────────────────────────────
export const appointmentSchema = z.object({
  vehicle: recordId, service: recordId, start: z.coerce.date({ invalid_type_error: 'Choose a valid date and time' }),
  issue: optStr(1000), customer: recordId.optional(),
});
export const rescheduleSchema = z.object({ start: z.coerce.date() });
export const appointmentStatusSchema = z.object({ status: z.enum(['confirmed', 'rejected', 'cancelled', 'no_show']), reason: optStr(300) });

// ── Jobs ────────────────────────────────────────────────────
export const jobCreateSchema = z.object({
  appointment: recordId.optional(), customer: recordId.optional(), vehicle: recordId.optional(),
  services: z.array(recordId).default([]),
  reportedProblem: reqStr('Reported problem', 1000),
  odometerIn: num('Odometer').min(0),
  assignedMechanic: z.preprocess((v) => (v === '' ? undefined : v), recordId.optional()),
  priority: z.enum(PRIORITIES).default('normal'),
  expectedCompletion: optDate, internalNotes: optStr(2000),
});
export const jobUpdateSchema = z.object({
  assignedMechanic: z.preprocess((v) => (v === '' ? null : v), recordId.nullable().optional()),
  priority: z.enum(PRIORITIES).optional(), expectedCompletion: optDate, internalNotes: optStr(2000),
  reportedProblem: reqStr('Reported problem', 1000).optional(),
});
export const transitionSchema = z.object({ to: z.string(), note: optStr(500) });
export const taskSchema = z.object({ description: reqStr('Task', 300) });
export const taskDoneSchema = z.object({ done: z.boolean() });
export const timeLogSchema = z.object({ minutes: num('Minutes').int().min(1).max(1440), note: optStr(300) });
export const noteSchema = z.object({ text: reqStr('Note', 1000) });
export const partRequestSchema = z.object({ item: recordId, quantity: num('Quantity').int().min(1), note: optStr(300) });
export const qualityCheckSchema = z.object({ passed: z.boolean(), notes: optStr(500) });

// ── Inspections / estimates ─────────────────────────────────
export const inspectionSchema = z.object({
  job: recordId,
  items: z.array(z.object({ component: reqStr('Component', 100), status: z.enum(['pass', 'attention', 'fail']), comment: optStr(300) })).min(1, 'Add at least one checklist item'),
  recommendedRepairs: z.array(z.object({ description: reqStr('Repair', 300), severity: z.enum(['low', 'medium', 'high']).default('medium') })).default([]),
  comments: optStr(2000),
});

const estimateLine = z.object({
  kind: z.enum(['labour', 'part']), description: reqStr('Description', 200),
  inventoryItem: z.preprocess((v) => (v === '' ? undefined : v), recordId.optional()),
  quantity: num('Quantity').positive('Quantity must be greater than 0'), unitPrice: num('Unit price').min(0),
});
export const estimateSchema = z.object({
  job: recordId.optional(),
  lines: z.array(estimateLine).min(1, 'Add at least one line item'),
  taxRate: num('Tax rate').min(0).max(100).default(0),
  discount: num('Discount').min(0).default(0),
  notes: optStr(2000), recommendations: optStr(2000),
});
export const decisionSchema = z.object({ decision: z.enum(['approve', 'reject']), note: optStr(500) });

// ── Inventory / suppliers / PO ──────────────────────────────
export const inventoryItemSchema = z.object({
  name: reqStr('Name', 150), sku: reqStr('SKU', 40), category: z.enum(PART_CATEGORIES).default('other'),
  supplier: z.preprocess((v) => (v === '' ? undefined : v), recordId.optional()),
  purchasePrice: num('Purchase price').min(0), sellingPrice: num('Selling price').min(0),
  quantity: num('Quantity').min(0).optional(), // opening stock — only honoured on create
  reorderLevel: num('Reorder level').min(0).default(5),
  location: optStr(80), isActive: z.boolean().optional(),
});
export const movementSchema = z.object({
  type: z.enum(['in', 'out', 'adjust']),
  quantity: num('Quantity').min(0),
  reason: z.enum(['purchase', 'opening', 'job_issue', 'return', 'damage', 'correction', 'other']).default('other'),
  note: optStr(300),
});
export const supplierSchema = z.object({
  name: reqStr('Name', 120), contactPerson: optStr(100),
  email: z.preprocess((v) => (v === '' ? undefined : v), email.optional()),
  phone: z.preprocess((v) => (v === '' ? undefined : v), phone.optional()), address: optStr(300), isActive: z.boolean().optional(),
});
export const purchaseOrderSchema = z.object({
  supplier: recordId,
  lines: z.array(z.object({ item: recordId, quantity: num('Quantity').int().min(1), unitCost: num('Unit cost').min(0) })).min(1, 'Add at least one line'),
  expectedDate: optDate, notes: optStr(500),
});
export const receiveSchema = z.object({ lines: z.array(z.object({ item: recordId, quantity: num('Quantity').int().min(1) })).min(1, 'Enter at least one received quantity') });

// ── Billing ─────────────────────────────────────────────────
export const invoiceCreateSchema = z.object({ job: recordId, dueDate: optDate });
export const paymentSchema = z.object({
  invoice: recordId, amount: num('Amount').positive('Amount must be greater than 0'),
  method: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'test']), reference: optStr(100), note: optStr(300),
});

// ── Misc ────────────────────────────────────────────────────
export const planSchema = z.object({
  vehicle: recordId, title: reqStr('Title', 100),
  intervalDays: z.preprocess((v) => (v === '' || v === null ? undefined : v), num('Interval days').int().min(1).optional()),
  intervalKm: z.preprocess((v) => (v === '' || v === null ? undefined : v), num('Interval km').int().min(1).optional()),
  lastServiceDate: optDate, lastServiceOdometer: z.preprocess((v) => (v === '' ? undefined : v), num('Odometer').min(0).optional()),
  notes: optStr(300), isActive: z.boolean().optional(),
}).refine((d) => d.intervalDays || d.intervalKm, { message: 'Set a day interval, a kilometre interval, or both', path: ['intervalDays'] });
export const reviewSchema = z.object({ job: recordId, rating: num('Rating').int().min(1).max(5), comment: optStr(1500) });
export const moderationSchema = z.object({ status: z.enum(['approved', 'rejected']), moderationNote: optStr(300) });
