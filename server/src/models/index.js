/**
 * Sequelize models (MySQL). Column names match the previous API field names; foreign keys are
 * `<alias>Id` and each association keeps the alias the API already used (customer, vehicle, ...),
 * so `include: ['customer']` still yields `{ customer: {...} }` in responses.
 */
import { DataTypes as T, define, money } from './base.js';
import { sequelize } from '../config/db.js';
import {
  ALL_ROLES, ROLES, FUEL_TYPES, VEHICLE_TYPES, SERVICE_CATEGORIES, PART_CATEGORIES, APPOINTMENT_STATUS, JOB_STATUS, PRIORITIES,
} from '../config/constants.js';

const stripSpaces = (v) => String(v ?? '').replace(/[\s-]+/g, '').toUpperCase();

// ── Users & customers ───────────────────────────────────────
export const User = define('User', {
  name: { type: T.STRING(100), allowNull: false, validate: { notEmpty: { msg: 'Name is required' } } },
  email: { type: T.STRING(190), allowNull: false, unique: true, set(v) { this.setDataValue('email', String(v).trim().toLowerCase()); } },
  passwordHash: { type: T.STRING(300), allowNull: false },
  role: { type: T.ENUM(...ALL_ROLES), allowNull: false, defaultValue: ROLES.CUSTOMER },
  phone: T.STRING(30),
  isActive: { type: T.BOOLEAN, allowNull: false, defaultValue: true },
  lastLoginAt: T.DATE,
  resetTokenHash: T.STRING(64),
  resetTokenExpires: T.DATE,
}, { defaultScope: { attributes: { exclude: ['passwordHash', 'resetTokenHash', 'resetTokenExpires'] } }, scopes: { withSecrets: { attributes: { include: ['passwordHash', 'resetTokenHash', 'resetTokenExpires'] } } } });

// Secrets can never be serialised, whatever scope loaded the row (e.g. right after create/login).
const baseToJSON = User.prototype.toJSON;
User.prototype.toJSON = function toJSON() {
  const j = baseToJSON.call(this);
  delete j.passwordHash; delete j.resetTokenHash; delete j.resetTokenExpires;
  return j;
};

export const Customer = define('Customer', {
  name: { type: T.STRING(100), allowNull: false },
  email: { type: T.STRING(190), set(v) { this.setDataValue('email', v ? String(v).trim().toLowerCase() : null); } },
  phone: { type: T.STRING(30), allowNull: false },
  address: T.STRING(300),
  notes: T.TEXT,
  isActive: { type: T.BOOLEAN, allowNull: false, defaultValue: true },
}, { indexes: [{ fields: ['name'] }, { fields: ['phone'] }, { unique: true, fields: ['userId'] }] });

export const Vehicle = define('Vehicle', {
  registrationNumber: { type: T.STRING(20), allowNull: false, unique: true, set(v) { this.setDataValue('registrationNumber', stripSpaces(v)); } },
  make: { type: T.STRING(50), allowNull: false },
  model: { type: T.STRING(50), allowNull: false },
  year: { type: T.INTEGER, allowNull: false, validate: { min: 1950, max: new Date().getFullYear() + 1 } },
  vehicleType: { type: T.ENUM(...VEHICLE_TYPES), allowNull: false, defaultValue: 'car' },
  fuelType: { type: T.ENUM(...FUEL_TYPES), allowNull: false },
  vin: { type: T.STRING(20), unique: true, set(v) { this.setDataValue('vin', v ? String(v).trim().toUpperCase() : null); } },
  color: T.STRING(30),
  odometer: { type: T.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  isActive: { type: T.BOOLEAN, allowNull: false, defaultValue: true },
});

export const ServiceCatalog = define('ServiceCatalog', {
  name: { type: T.STRING(120), allowNull: false, unique: true },
  description: T.STRING(600),
  category: { type: T.ENUM(...SERVICE_CATEGORIES), allowNull: false, defaultValue: 'general' },
  estimatedPrice: money('estimatedPrice', 10, 2),
  estimatedDurationMinutes: { type: T.INTEGER, allowNull: false, validate: { min: 15, max: 1440 } },
  vehicleTypes: { type: T.JSON, allowNull: false, defaultValue: VEHICLE_TYPES },
  isActive: { type: T.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'servicecatalog' });

// ── Appointments & jobs ─────────────────────────────────────
export const Appointment = define('Appointment', {
  appointmentNo: { type: T.STRING(20), unique: true },
  start: { type: T.DATE, allowNull: false },
  end: { type: T.DATE, allowNull: false },
  issue: T.STRING(1000),
  status: { type: T.ENUM(...APPOINTMENT_STATUS), allowNull: false, defaultValue: 'pending' },
  statusReason: T.STRING(300),
  history: { type: T.JSON, allowNull: false, defaultValue: [] },
}, { indexes: [{ fields: ['start'] }, { fields: ['status'] }] });

export const ServiceJob = define('ServiceJob', {
  jobNo: { type: T.STRING(20), unique: true },
  reportedProblem: { type: T.STRING(1000), allowNull: false },
  odometerIn: { type: T.INTEGER.UNSIGNED, allowNull: false },
  checkInAt: { type: T.DATE, defaultValue: T.NOW },
  priority: { type: T.ENUM(...PRIORITIES), allowNull: false, defaultValue: 'normal' },
  status: { type: T.ENUM(...JOB_STATUS), allowNull: false, defaultValue: 'checked_in' },
  expectedCompletion: T.DATE,
  internalNotes: T.TEXT,
  resumeStatus: T.STRING(30), // status to return to after an estimate (re)approval round
  workStartedAt: T.DATE,
  completedAt: T.DATE,
  deliveredAt: T.DATE,
  qualityCheck: T.JSON, // { passed, by, at, notes }
}, { tableName: 'servicejobs', indexes: [{ fields: ['status'] }] });

export const JobTask = define('JobTask', {
  description: { type: T.STRING(300), allowNull: false },
  done: { type: T.BOOLEAN, allowNull: false, defaultValue: false },
  doneAt: T.DATE,
}, { tableName: 'job_tasks' });
export const JobTimeLog = define('JobTimeLog', {
  minutes: { type: T.INTEGER, allowNull: false, validate: { min: 1, max: 1440 } },
  note: T.STRING(300),
  at: { type: T.DATE, defaultValue: T.NOW },
}, { tableName: 'job_time_logs', timestamps: false });
export const JobNote = define('JobNote', {
  text: { type: T.STRING(1000), allowNull: false },
  at: { type: T.DATE, defaultValue: T.NOW },
}, { tableName: 'job_notes', timestamps: false });
export const JobPartRequest = define('JobPartRequest', {
  quantity: { type: T.INTEGER.UNSIGNED, allowNull: false, validate: { min: 1 } },
  status: { type: T.ENUM('requested', 'issued', 'rejected'), allowNull: false, defaultValue: 'requested' },
  requestedAt: { type: T.DATE, defaultValue: T.NOW },
  note: T.STRING(300),
  resolvedAt: T.DATE,
  unitCost: money('unitCost', 10, 2, { allowNull: true, defaultValue: null }),
}, { tableName: 'job_part_requests' });
export const JobHistory = define('JobHistory', {
  from: { type: T.STRING(30), field: 'from_status' },
  to: { type: T.STRING(30), allowNull: false, field: 'to_status' },
  at: { type: T.DATE, defaultValue: T.NOW },
  note: T.STRING(500),
}, { tableName: 'job_history', timestamps: false });

export const Inspection = define('Inspection', {
  items: { type: T.JSON, allowNull: false },
  recommendedRepairs: { type: T.JSON, allowNull: false, defaultValue: [] },
  comments: T.TEXT,
  inspectedAt: { type: T.DATE, defaultValue: T.NOW },
});

export const Estimate = define('Estimate', {
  estimateNo: { type: T.STRING(20), unique: true },
  revision: { type: T.INTEGER, allowNull: false, defaultValue: 1 },
  status: { type: T.ENUM('draft', 'pending_approval', 'approved', 'rejected', 'superseded'), allowNull: false, defaultValue: 'draft' },
  lines: { type: T.JSON, allowNull: false, defaultValue: [] },
  subtotal: money('subtotal'),
  discount: money('discount'),
  taxRate: money('taxRate', 5, 2),
  taxAmount: money('taxAmount'),
  total: money('total'),
  notes: T.TEXT,
  recommendations: T.TEXT,
  decisions: { type: T.JSON, allowNull: false, defaultValue: [] }, // [{ action, by:{_id,name}, onBehalf, at, note }]
}, { indexes: [{ unique: true, fields: ['jobId', 'revision'] }] });

// ── Inventory & purchasing ──────────────────────────────────
export const Supplier = define('Supplier', {
  name: { type: T.STRING(120), allowNull: false, unique: true },
  contactPerson: T.STRING(100),
  email: { type: T.STRING(190), set(v) { this.setDataValue('email', v ? String(v).trim().toLowerCase() : null); } },
  phone: T.STRING(30),
  address: T.STRING(300),
  isActive: { type: T.BOOLEAN, allowNull: false, defaultValue: true },
});

export const InventoryItem = define('InventoryItem', {
  name: { type: T.STRING(150), allowNull: false },
  sku: { type: T.STRING(40), allowNull: false, unique: true, set(v) { this.setDataValue('sku', String(v).trim().toUpperCase()); } },
  category: { type: T.ENUM(...PART_CATEGORIES), allowNull: false, defaultValue: 'other' },
  purchasePrice: money('purchasePrice', 10, 2),
  sellingPrice: money('sellingPrice', 10, 2),
  // quantity is only changed via inventory.service (locked transaction + movement record); UNSIGNED = DB-level "never negative"
  quantity: { type: T.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  reorderLevel: { type: T.INTEGER.UNSIGNED, allowNull: false, defaultValue: 5 },
  location: T.STRING(80),
  isActive: { type: T.BOOLEAN, allowNull: false, defaultValue: true },
  stockStatus: {
    type: T.VIRTUAL,
    get() {
      const q = this.getDataValue('quantity'), r = this.getDataValue('reorderLevel');
      if (q == null) return undefined;
      return q <= 0 ? 'out_of_stock' : q <= r ? 'low_stock' : 'in_stock';
    },
  },
}, { tableName: 'inventoryitems' });

export const InventoryMovement = define('InventoryMovement', {
  type: { type: T.ENUM('in', 'out', 'adjust'), allowNull: false },
  delta: { type: T.INTEGER, allowNull: false },
  balanceAfter: { type: T.INTEGER, allowNull: false },
  reason: { type: T.ENUM('purchase', 'opening', 'job_issue', 'return', 'damage', 'correction', 'other'), allowNull: false, defaultValue: 'other' },
  referenceKind: T.STRING(30),
  referenceId: T.INTEGER,
  note: T.STRING(300),
}, { tableName: 'inventorymovements', updatedAt: false });

export const PurchaseOrder = define('PurchaseOrder', {
  poNo: { type: T.STRING(20), unique: true },
  status: { type: T.ENUM('draft', 'ordered', 'partially_received', 'received', 'cancelled'), allowNull: false, defaultValue: 'draft' },
  total: money('total'),
  expectedDate: T.DATE,
  notes: T.STRING(500),
  receipts: { type: T.JSON, allowNull: false, defaultValue: [] },
}, { tableName: 'purchaseorders' });
export const PurchaseOrderLine = define('PurchaseOrderLine', {
  quantity: { type: T.INTEGER.UNSIGNED, allowNull: false, validate: { min: 1 } },
  unitCost: money('unitCost', 10, 2),
  receivedQuantity: { type: T.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
}, { tableName: 'purchase_order_lines', timestamps: false, indexes: [{ unique: true, fields: ['purchaseOrderId', 'itemId'] }] });

// ── Billing ─────────────────────────────────────────────────
export const Invoice = define('Invoice', {
  invoiceNo: { type: T.STRING(20), unique: true },
  lines: { type: T.JSON, allowNull: false, defaultValue: [] },
  subtotal: money('subtotal'),
  discount: money('discount'),
  taxRate: money('taxRate', 5, 2),
  taxAmount: money('taxAmount'),
  total: money('total'),
  amountPaid: money('amountPaid'),
  balance: money('balance'),
  status: { type: T.ENUM('unpaid', 'partial', 'paid', 'void'), allowNull: false, defaultValue: 'unpaid' },
  issuedAt: { type: T.DATE, defaultValue: T.NOW },
  dueDate: T.DATE,
}, { indexes: [{ unique: true, fields: ['jobId'] }] });

export const Payment = define('Payment', {
  paymentNo: { type: T.STRING(20), unique: true },
  amount: money('amount'),
  method: { type: T.ENUM('cash', 'card', 'upi', 'bank_transfer', 'test'), allowNull: false },
  reference: T.STRING(100),
  isTest: { type: T.BOOLEAN, allowNull: false, defaultValue: false }, // every payment is manual; `test` marks simulated ones
  note: T.STRING(300),
  paidAt: { type: T.DATE, defaultValue: T.NOW },
});

// ── Supporting ──────────────────────────────────────────────
export const Notification = define('Notification', {
  type: { type: T.STRING(60), allowNull: false },
  title: { type: T.STRING(200), allowNull: false },
  message: T.STRING(500),
  link: T.STRING(200),
  read: { type: T.BOOLEAN, allowNull: false, defaultValue: false },
}, { updatedAt: false, indexes: [{ fields: ['userId', 'read', 'createdAt'] }] });

export const MaintenancePlan = define('MaintenancePlan', {
  title: { type: T.STRING(100), allowNull: false },
  intervalDays: T.INTEGER,
  intervalKm: T.INTEGER,
  lastServiceDate: T.DATE,
  lastServiceOdometer: T.INTEGER,
  nextDueDate: T.DATE,
  nextDueOdometer: T.INTEGER,
  notes: T.STRING(300),
  isActive: { type: T.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'maintenanceplans' });

export const Review = define('Review', {
  rating: { type: T.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  comment: T.STRING(1500),
  status: { type: T.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
  moderationNote: T.STRING(300),
}, { indexes: [{ unique: true, fields: ['jobId'] }] });

export const AuditLog = define('AuditLog', {
  actorId: T.INTEGER.UNSIGNED, // intentionally no FK: logs must outlive users
  actorName: T.STRING(100),
  actorRole: T.STRING(30),
  action: { type: T.STRING(60), allowNull: false },
  entityType: T.STRING(40),
  entityId: T.INTEGER.UNSIGNED,
  summary: T.STRING(500),
  meta: T.JSON,
  ip: T.STRING(60),
}, { tableName: 'auditlogs', updatedAt: false, indexes: [{ fields: ['action'] }, { fields: ['entityType'] }, { fields: ['createdAt'] }] });

export const Counter = define('Counter', {
  name: { type: T.STRING(20), primaryKey: true },
  seq: { type: T.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
}, { tableName: 'counters', timestamps: false });

// ── Associations (alias = API field name; FK = `${alias}Id`) ─
const bt = (M, alias, Target, opts = {}) => M.belongsTo(Target, { as: alias, foreignKey: { name: `${alias}Id`, allowNull: !opts.required }, onDelete: opts.required ? 'RESTRICT' : 'SET NULL' });

bt(Customer, 'user', User);
bt(Vehicle, 'customer', Customer, { required: true });
Customer.hasMany(Vehicle, { as: 'vehicles', foreignKey: 'customerId' });

bt(Appointment, 'customer', Customer, { required: true });
bt(Appointment, 'vehicle', Vehicle, { required: true });
bt(Appointment, 'service', ServiceCatalog, { required: true });
bt(Appointment, 'createdBy', User);

bt(ServiceJob, 'customer', Customer, { required: true });
bt(ServiceJob, 'vehicle', Vehicle, { required: true });
bt(ServiceJob, 'appointment', Appointment);
bt(ServiceJob, 'assignedMechanic', User);
ServiceJob.belongsToMany(ServiceCatalog, { as: 'services', through: 'job_services', foreignKey: 'jobId', otherKey: 'serviceId', timestamps: false });

for (const [M, alias, extra] of [[JobTask, 'tasks', ['by']], [JobTimeLog, 'timeLogs', ['mechanic']], [JobNote, 'notes', ['by']], [JobPartRequest, 'partRequests', ['item', 'requestedBy', 'resolvedBy']], [JobHistory, 'history', ['by']]]) {
  ServiceJob.hasMany(M, { as: alias, foreignKey: { name: 'jobId', allowNull: false }, onDelete: 'CASCADE' });
  M.belongsTo(ServiceJob, { as: 'job', foreignKey: 'jobId' });
  for (const a of extra) bt(M, a, a === 'item' ? InventoryItem : User, { required: a === 'item' });
}

bt(Inspection, 'job', ServiceJob, { required: true });
bt(Inspection, 'vehicle', Vehicle, { required: true });
bt(Inspection, 'customer', Customer, { required: true });
bt(Inspection, 'inspector', User, { required: true });

bt(Estimate, 'job', ServiceJob, { required: true });
bt(Estimate, 'customer', Customer, { required: true });
bt(Estimate, 'vehicle', Vehicle, { required: true });
bt(Estimate, 'createdBy', User);

bt(InventoryItem, 'supplier', Supplier);
Supplier.hasMany(InventoryItem, { as: 'parts', foreignKey: 'supplierId' });
bt(InventoryMovement, 'item', InventoryItem, { required: true });
bt(InventoryMovement, 'by', User);

bt(PurchaseOrder, 'supplier', Supplier, { required: true });
bt(PurchaseOrder, 'createdBy', User);
PurchaseOrder.hasMany(PurchaseOrderLine, { as: 'lines', foreignKey: { name: 'purchaseOrderId', allowNull: false }, onDelete: 'CASCADE' });
PurchaseOrderLine.belongsTo(PurchaseOrder, { as: 'purchaseOrder', foreignKey: 'purchaseOrderId' });
bt(PurchaseOrderLine, 'item', InventoryItem, { required: true });

bt(Invoice, 'job', ServiceJob, { required: true });
bt(Invoice, 'estimate', Estimate);
bt(Invoice, 'customer', Customer, { required: true });
bt(Invoice, 'vehicle', Vehicle, { required: true });
bt(Invoice, 'createdBy', User);
bt(Payment, 'invoice', Invoice, { required: true });
bt(Payment, 'customer', Customer, { required: true });
bt(Payment, 'receivedBy', User);
Invoice.hasMany(Payment, { as: 'payments', foreignKey: 'invoiceId' });

bt(Notification, 'user', User, { required: true });
bt(MaintenancePlan, 'vehicle', Vehicle, { required: true });
bt(MaintenancePlan, 'customer', Customer, { required: true });
bt(Review, 'job', ServiceJob, { required: true });
bt(Review, 'customer', Customer, { required: true });
bt(Review, 'moderatedBy', User);

export { sequelize };
