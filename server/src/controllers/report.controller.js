import { Op, QueryTypes, literal } from 'sequelize';
import {
  Customer, Vehicle, Appointment, ServiceJob, Estimate, InventoryItem, Invoice, Payment, User, MaintenancePlan, JobHistory, JobPartRequest,
} from '../models/index.js';
import { sequelize } from '../config/db.js';
import { ROLES } from '../config/constants.js';
import { ok } from '../utils/pagination.js';
import { round2 } from '../utils/money.js';
import { planDueState } from '../services/job.service.js';

const DAY = 86_400_000;
const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const ACTIVE = { [Op.notIn]: ['delivered', 'cancelled'] };
const LOW = literal('`InventoryItem`.`quantity` <= `InventoryItem`.`reorderLevel`');
const sql = (query, replacements = {}) => sequelize.query(query, { replacements, type: QueryTypes.SELECT });
const num = (v) => Number(v ?? 0);
const sumOf = async (Model, field, where) => num(await Model.sum(field, { where }));

/** ?from=YYYY-MM-DD&to=YYYY-MM-DD (inclusive); defaults to the last 30 days. */
function range(req) {
  const to = req.query.to ? new Date(req.query.to) : new Date();
  to.setHours(23, 59, 59, 999);
  const from = req.query.from ? startOfDay(req.query.from) : startOfDay(new Date(+to - 29 * DAY));
  return { from, to };
}

/** Fill days with no activity so charts have a continuous axis. rows: [{ d: 'YYYY-MM-DD', ...numbers }] */
function fillDays(rows, from, to, keys) {
  const map = new Map(rows.map((r) => [r.d, r]));
  const out = [];
  for (let t = +startOfDay(from); t <= +to; t += DAY) {
    const k = new Date(t).toLocaleDateString('en-CA');
    const r = map.get(k);
    out.push({ date: k, ...Object.fromEntries(keys.map((x) => [x, num(r?.[x])])) });
  }
  return out;
}

// ── Dashboard (role-aware) ───────────────────────────────────
export async function dashboard(req, res) {
  const role = req.user.role;
  const today = startOfDay();
  const tomorrow = new Date(+today + DAY);

  if (role === ROLES.CUSTOMER) {
    const f = { customerId: req.customerId ?? -1 };
    const [vehicles, upcoming, activeJobs, pendingEstimates, due, nUnpaid, plans] = await Promise.all([
      Vehicle.count({ where: { ...f, isActive: true } }),
      Appointment.findAll({ where: { ...f, status: { [Op.in]: ['pending', 'confirmed'] }, start: { [Op.gte]: new Date() } }, include: [{ association: 'service', attributes: ['id', 'name'] }, { association: 'vehicle', attributes: ['id', 'registrationNumber'] }], order: [['start', 'ASC']], limit: 5 }),
      ServiceJob.findAll({ where: { ...f, status: ACTIVE }, include: [{ association: 'vehicle', attributes: ['id', 'registrationNumber', 'make', 'model'] }], order: [['checkInAt', 'DESC']], limit: 5 }),
      Estimate.count({ where: { ...f, status: 'pending_approval' } }),
      sumOf(Invoice, 'balance', { ...f, status: { [Op.in]: ['unpaid', 'partial'] } }),
      Invoice.count({ where: { ...f, status: { [Op.in]: ['unpaid', 'partial'] } } }),
      MaintenancePlan.findAll({ where: { ...f, isActive: true }, include: [{ association: 'vehicle', attributes: ['id', 'registrationNumber', 'odometer'] }] }),
    ]);
    return ok(res, {
      kind: 'customer',
      stats: { vehicles, upcomingAppointments: upcoming.length, activeJobs: activeJobs.length, pendingEstimates, outstandingBalance: round2(due), unpaidInvoices: nUnpaid },
      upcomingAppointments: upcoming, activeJobs,
      reminders: plans.map((p) => ({ ...p.toJSON(), dueReasons: planDueState(p, p.vehicle?.odometer) })).filter((p) => p.dueReasons.length),
    });
  }

  if (role === ROLES.MECHANIC) {
    const f = { assignedMechanicId: req.user.id };
    const [assigned, inProgress, qc, jobs, pendingParts] = await Promise.all([
      ServiceJob.count({ where: { ...f, status: ACTIVE } }),
      ServiceJob.count({ where: { ...f, status: 'in_progress' } }),
      ServiceJob.count({ where: { ...f, status: 'quality_check' } }),
      ServiceJob.findAll({ where: { ...f, status: ACTIVE }, include: [{ association: 'vehicle', attributes: ['id', 'registrationNumber', 'make', 'model'] }], order: [[literal("FIELD(priority,'urgent','high','normal','low')"), 'ASC'], ['checkInAt', 'ASC']], limit: 6 }),
      JobPartRequest.count({ where: { status: 'requested' }, include: [{ association: 'job', attributes: [], where: f, required: true }], distinct: true, col: 'jobId' }),
    ]);
    return ok(res, { kind: 'mechanic', stats: { assignedJobs: assigned, inProgress, awaitingQuality: qc, pendingParts }, activeJobs: jobs });
  }

  const canSeeMoney = [ROLES.SUPER_ADMIN, ROLES.WORKSHOP_ADMIN, ROLES.CASHIER].includes(role);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const [customers, vehicles, todayAppts, activeJobs, pendingEstimates, lowStock, upcoming, activity] = await Promise.all([
    Customer.count({ where: { isActive: true } }),
    Vehicle.count({ where: { isActive: true } }),
    Appointment.count({ where: { start: { [Op.gte]: today, [Op.lt]: tomorrow }, status: { [Op.in]: ['pending', 'confirmed', 'checked_in'] } } }),
    ServiceJob.count({ where: { status: ACTIVE } }),
    Estimate.count({ where: { status: 'pending_approval' } }),
    InventoryItem.count({ where: { [Op.and]: [{ isActive: true }, LOW] } }),
    Appointment.findAll({ where: { status: { [Op.in]: ['pending', 'confirmed'] }, start: { [Op.gte]: new Date() } }, include: [{ association: 'customer', attributes: ['id', 'name'] }, { association: 'vehicle', attributes: ['id', 'registrationNumber', 'make', 'model'] }, { association: 'service', attributes: ['id', 'name'] }], order: [['start', 'ASC']], limit: 6 }),
    JobHistory.findAll({ include: [{ association: 'job', attributes: ['id', 'jobNo'], include: [{ association: 'vehicle', attributes: ['registrationNumber'] }] }], order: [['at', 'DESC'], ['id', 'DESC']], limit: 8 }),
  ]);
  const data = {
    kind: 'staff', stats: { customers, vehicles, todayAppointments: todayAppts, activeJobs, pendingEstimates, inventoryAlerts: lowStock }, upcomingAppointments: upcoming,
    recentActivity: activity.map((h) => ({ jobNo: h.job?.jobNo, to: h.to, note: h.note, at: h.at, vehicle: h.job?.vehicle?.registrationNumber })),
  };

  if (canSeeMoney) {
    const [todayRev, monthRev, outstanding, series] = await Promise.all([
      sumOf(Payment, 'amount', { paidAt: { [Op.gte]: today } }), sumOf(Payment, 'amount', { paidAt: { [Op.gte]: monthStart } }),
      sumOf(Invoice, 'balance', { status: { [Op.in]: ['unpaid', 'partial'] } }),
      sql("SELECT DATE_FORMAT(paidAt,'%Y-%m-%d') d, SUM(amount) revenue FROM payments WHERE paidAt >= :from GROUP BY d", { from: new Date(+today - 13 * DAY) }),
    ]);
    data.revenue = { today: round2(todayRev), month: round2(monthRev), outstanding: round2(outstanding), series: fillDays(series, new Date(+today - 13 * DAY), today, ['revenue']) };
  }
  ok(res, data);
}

// ── Detailed reports ─────────────────────────────────────────
export async function revenue(req, res) {
  const { from, to } = range(req);
  const r = { from, to };
  const [byDay, byMethod, totals] = await Promise.all([
    sql("SELECT DATE_FORMAT(paidAt,'%Y-%m-%d') d, SUM(amount) revenue, COUNT(*) payments FROM payments WHERE paidAt BETWEEN :from AND :to GROUP BY d", r),
    sql('SELECT method, SUM(amount) amount, COUNT(*) count FROM payments WHERE paidAt BETWEEN :from AND :to GROUP BY method ORDER BY amount DESC', r),
    sql('SELECT COALESCE(SUM(amount),0) revenue, COUNT(*) count FROM payments WHERE paidAt BETWEEN :from AND :to', r),
  ]);
  ok(res, { from, to, total: round2(num(totals[0].revenue)), payments: num(totals[0].count), series: fillDays(byDay, from, to, ['revenue', 'payments']), byMethod: byMethod.map((m) => ({ method: m.method, amount: round2(num(m.amount)), count: num(m.count) })) });
}

export async function services(req, res) {
  const { from, to } = range(req);
  const r = { from, to };
  const [byDay, topServices, total] = await Promise.all([
    sql("SELECT DATE_FORMAT(completedAt,'%Y-%m-%d') d, COUNT(*) completed FROM servicejobs WHERE completedAt BETWEEN :from AND :to GROUP BY d", r),
    sql('SELECT s.id _id, s.name, COUNT(*) count FROM servicejobs j JOIN job_services js ON js.jobId = j.id JOIN servicecatalog s ON s.id = js.serviceId WHERE j.completedAt BETWEEN :from AND :to GROUP BY s.id, s.name ORDER BY count DESC LIMIT 8', r),
    ServiceJob.count({ where: { completedAt: { [Op.between]: [from, to] } } }),
  ]);
  ok(res, { from, to, total, series: fillDays(byDay, from, to, ['completed']), topServices: topServices.map((t) => ({ ...t, count: num(t.count) })) });
}

export async function pendingJobs(_req, res) {
  const [byStatus, oldest] = await Promise.all([
    sql("SELECT status, COUNT(*) count FROM servicejobs WHERE status NOT IN ('delivered','cancelled') GROUP BY status"),
    ServiceJob.findAll({ where: { status: ACTIVE }, include: [{ association: 'vehicle', attributes: ['id', 'registrationNumber', 'make', 'model'] }, { association: 'assignedMechanic', attributes: ['id', 'name'] }], order: [['checkInAt', 'ASC']], limit: 10 }),
  ]);
  ok(res, { byStatus: byStatus.map((s) => ({ status: s.status, count: num(s.count) })), oldest });
}

export async function appointmentTrends(req, res) {
  const { from, to } = range(req);
  const r = { from, to };
  const [byDay, byStatus, total] = await Promise.all([
    sql("SELECT DATE_FORMAT(`start`,'%Y-%m-%d') d, COUNT(*) appointments FROM appointments WHERE `start` BETWEEN :from AND :to GROUP BY d", r),
    sql('SELECT status, COUNT(*) count FROM appointments WHERE `start` BETWEEN :from AND :to GROUP BY status', r),
    Appointment.count({ where: { start: { [Op.between]: [from, to] } } }),
  ]);
  ok(res, { from, to, total, series: fillDays(byDay, from, to, ['appointments']), byStatus: byStatus.map((s) => ({ status: s.status, count: num(s.count) })) });
}

export async function inventoryMovement(req, res) {
  const { from, to } = range(req);
  const r = { from, to };
  const [byDay, topItems] = await Promise.all([
    sql("SELECT DATE_FORMAT(createdAt,'%Y-%m-%d') d, SUM(CASE WHEN delta > 0 THEN delta ELSE 0 END) stockIn, SUM(CASE WHEN delta < 0 THEN -delta ELSE 0 END) stockOut FROM inventorymovements WHERE createdAt BETWEEN :from AND :to GROUP BY d", r),
    sql('SELECT i.name, i.sku, SUM(-m.delta) used FROM inventorymovements m JOIN inventoryitems i ON i.id = m.itemId WHERE m.createdAt BETWEEN :from AND :to AND m.delta < 0 GROUP BY i.id, i.name, i.sku ORDER BY used DESC LIMIT 8', r),
  ]);
  ok(res, { from, to, series: fillDays(byDay, from, to, ['stockIn', 'stockOut']), topItems: topItems.map((t) => ({ ...t, used: num(t.used) })) });
}

export async function lowStock(_req, res) {
  ok(res, await InventoryItem.findAll({ where: { [Op.and]: [{ isActive: true }, LOW] }, include: [{ association: 'supplier', attributes: ['id', 'name'] }], order: [['quantity', 'ASC']], limit: 200 }));
}

export async function mechanicWorkload(req, res) {
  const { from, to } = range(req);
  const r = { from, to };
  const mechanics = await User.findAll({ where: { role: ROLES.MECHANIC, isActive: true }, attributes: ['id', 'name'], order: [['name', 'ASC']] });
  const [open, logged, done] = await Promise.all([
    sql("SELECT assignedMechanicId id, COUNT(*) n FROM servicejobs WHERE status NOT IN ('delivered','cancelled') AND assignedMechanicId IS NOT NULL GROUP BY assignedMechanicId"),
    sql('SELECT mechanicId id, SUM(minutes) n FROM job_time_logs WHERE `at` BETWEEN :from AND :to GROUP BY mechanicId', r),
    sql('SELECT assignedMechanicId id, COUNT(*) n FROM servicejobs WHERE completedAt BETWEEN :from AND :to AND assignedMechanicId IS NOT NULL GROUP BY assignedMechanicId', r),
  ]);
  const by = (rows) => new Map(rows.map((x) => [x.id, num(x.n)]));
  const o = by(open), l = by(logged), d = by(done);
  ok(res, { from, to, mechanics: mechanics.map((m) => ({ _id: String(m.id), name: m.name, openJobs: o.get(m.id) ?? 0, completedJobs: d.get(m.id) ?? 0, hoursLogged: round2((l.get(m.id) ?? 0) / 60) })) });
}

export async function customerActivity(req, res) {
  const { from, to } = range(req);
  const r = { from, to };
  const [newCustomers, top, rating] = await Promise.all([
    Customer.count({ where: { createdAt: { [Op.between]: [from, to] } } }),
    sql("SELECT c.name, COUNT(*) invoices, SUM(i.total) spend FROM invoices i JOIN customers c ON c.id = i.customerId WHERE i.issuedAt BETWEEN :from AND :to AND i.status <> 'void' GROUP BY c.id, c.name ORDER BY spend DESC LIMIT 8", r),
    sql("SELECT AVG(rating) avg, COUNT(*) n FROM reviews WHERE status = 'approved'"),
  ]);
  ok(res, { from, to, newCustomers, topCustomers: top.map((t) => ({ name: t.name, invoices: num(t.invoices), spend: round2(num(t.spend)) })), rating: { average: round2(num(rating[0].avg)), count: num(rating[0].n) } });
}

