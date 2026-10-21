import { Op } from 'sequelize';
import { Notification, MaintenancePlan, Review, ServiceJob, Vehicle, AuditLog } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, and, ok, created, list } from '../utils/pagination.js';
import { ownerFilter, isCustomer } from '../middleware/auth.js';
import { audit } from '../services/audit.service.js';
import { planDueState } from '../services/job.service.js';
import { assertAccess, found } from './helpers.js';

// ── Notifications (always the caller's own) ──────────────────
export async function listNotifications(req, res) {
  const where = { userId: req.user.id };
  if (req.query.unread === 'true') where.read = false;
  const r = await paginate(Notification, req, { where, defaultLimit: 20, order: [['createdAt', 'DESC'], ['id', 'DESC']] });
  list(res, { ...r, pagination: { ...r.pagination, unread: await Notification.count({ where: { userId: req.user.id, read: false } }) } });
}
export async function markRead(req, res) {
  const n = found(await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } }), 'Notification');
  await n.update({ read: true });
  ok(res, n);
}
export async function markAllRead(req, res) {
  const [updated] = await Notification.update({ read: true }, { where: { userId: req.user.id, read: false } });
  ok(res, { updated });
}

// ── Maintenance plans / reminders ────────────────────────────
const PLAN_POP = [{ association: 'vehicle', attributes: ['id', 'registrationNumber', 'make', 'model', 'odometer'] }];
const withDue = (p) => ({ ...p.toJSON(), dueReasons: planDueState(p, p.vehicle?.odometer) });

export async function listPlans(req, res) {
  const where = { ...ownerFilter(req), isActive: true };
  if (req.query.vehicle) where.vehicleId = req.query.vehicle;
  const r = await paginate(MaintenancePlan, req, { where, include: PLAN_POP, order: [['nextDueDate', 'ASC']], defaultLimit: 50 });
  list(res, { ...r, items: r.items.map(withDue) });
}

/** Plans that are overdue or coming due (by date or odometer). */
export async function duePlans(req, res) {
  const plans = await MaintenancePlan.findAll({ where: { ...ownerFilter(req), isActive: true }, include: [...PLAN_POP, { association: 'customer', attributes: ['id', 'name'] }] });
  ok(res, plans.map(withDue).filter((p) => p.dueReasons.length));
}

function computeNext(p) {
  const base = p.lastServiceDate ?? new Date();
  p.nextDueDate = p.intervalDays ? new Date(+base + p.intervalDays * 86_400_000) : null;
  p.nextDueOdometer = p.intervalKm && p.lastServiceOdometer != null ? p.lastServiceOdometer + p.intervalKm : null;
}

export async function createPlan(req, res) {
  const { vehicle: vehicleId, ...fields } = req.body;
  const veh = found(await Vehicle.findByPk(vehicleId), 'Vehicle');
  const p = MaintenancePlan.build({ ...fields, vehicleId: veh.id, customerId: veh.customerId });
  if (p.lastServiceOdometer == null) p.lastServiceOdometer = veh.odometer;
  computeNext(p);
  await p.save();
  await audit(req, 'plan.create', { type: 'MaintenancePlan', id: p.id }, `Reminder "${p.title}" for ${veh.registrationNumber}`);
  created(res, p);
}

export async function updatePlan(req, res) {
  const p = found(await MaintenancePlan.findByPk(req.params.id), 'Plan');
  const { vehicle: _v, ...data } = req.body;
  p.set(data);
  computeNext(p);
  await p.save();
  ok(res, p);
}

export async function deletePlan(req, res) {
  const p = found(await MaintenancePlan.findByPk(req.params.id), 'Plan');
  await p.update({ isActive: false });
  ok(res, p);
}

// ── Reviews ──────────────────────────────────────────────────
const REVIEW_POP = [{ association: 'customer', attributes: ['id', 'name'] }, { association: 'job', attributes: ['id', 'jobNo', 'vehicleId'], include: [{ association: 'vehicle', attributes: ['id', 'make', 'model'] }] }];

export async function listReviews(req, res) {
  const where = { ...ownerFilter(req) };
  if (!isCustomer(req) && req.query.status) where.status = req.query.status;
  list(res, await paginate(Review, req, { where, include: REVIEW_POP }));
}

/** Jobs the customer can still review (delivered, no review yet). */
export async function reviewable(req, res) {
  const jobs = await ServiceJob.findAll({ where: { ...ownerFilter(req), status: 'delivered' }, include: [{ association: 'vehicle', attributes: ['id', 'make', 'model', 'registrationNumber'] }], order: [['deliveredAt', 'DESC']], limit: 50 });
  const reviewed = new Set((await Review.findAll({ where: { jobId: { [Op.in]: jobs.map((j) => j.id) } }, attributes: ['jobId'] })).map((r) => r.jobId));
  ok(res, jobs.filter((j) => !reviewed.has(j.id)).map((j) => ({ _id: String(j.id), jobNo: j.jobNo, vehicle: j.vehicle, deliveredAt: j.deliveredAt })));
}

export async function createReview(req, res) {
  const job = assertAccess(req, await ServiceJob.findByPk(req.body.job));
  if (job.status !== 'delivered') throw ApiError.conflict('You can review a service once the vehicle has been delivered');
  if (await Review.count({ where: { jobId: job.id } })) throw ApiError.conflict('You have already reviewed this service');
  created(res, await Review.create({ jobId: job.id, customerId: job.customerId, rating: req.body.rating, comment: req.body.comment }));
}

export async function moderateReview(req, res) {
  const r = found(await Review.findByPk(req.params.id), 'Review');
  await r.update({ ...req.body, moderatedById: req.user.id });
  await audit(req, 'review.moderate', { type: 'Review', id: r.id }, `Review ${r.status}`, req.body);
  ok(res, r);
}

// ── Audit log ────────────────────────────────────────────────
export async function listAudit(req, res) {
  const where = {};
  if (req.query.action) where.action = { [Op.like]: `${String(req.query.action).replace(/[^\w.]/g, '')}%` };
  if (req.query.entityType) where.entityType = req.query.entityType;
  if (req.query.actor) where.actorId = req.query.actor;
  if (req.query.from || req.query.to) {
    where.createdAt = {};
    if (req.query.from) where.createdAt[Op.gte] = new Date(req.query.from);
    if (req.query.to) { const t = new Date(req.query.to); t.setHours(23, 59, 59, 999); where.createdAt[Op.lte] = t; }
  }
  list(res, await paginate(AuditLog, req, { where: and(where), order: [['createdAt', 'DESC'], ['id', 'DESC']], defaultLimit: 25 }));
}
