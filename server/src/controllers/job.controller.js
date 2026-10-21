import { Op, literal } from 'sequelize';
import {
  ServiceJob, Appointment, Vehicle, Customer, InventoryItem, User, JobTask, JobTimeLog, JobNote, JobPartRequest, JobHistory,
} from '../models/index.js';
import { sequelize } from '../config/db.js';
import { ROLES, ADVISORS, STOCK_ROLES } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, searchFilter, and, ok, created, list } from '../utils/pagination.js';
import { nextNumber } from '../utils/sequence.js';
import { ownerFilter, isCustomer } from '../middleware/auth.js';
import { audit } from '../services/audit.service.js';
import { applyMovement } from '../services/inventory.service.js';
import { notifyRoles, notifyUsers, safe } from '../services/notification.service.js';
import { transitionJob, setJobStatus, notifyAssignment } from '../services/job.service.js';
import { assertAccess, found, toFk } from './helpers.js';

const POP = [
  { association: 'customer', attributes: ['id', 'name', 'phone', 'email'] },
  { association: 'vehicle', attributes: ['id', 'registrationNumber', 'make', 'model', 'year', 'odometer'] },
  { association: 'assignedMechanic', attributes: ['id', 'name'] },
  { association: 'services', attributes: ['id', 'name'], through: { attributes: [] } },
];
const LABOUR_SQL = literal('(SELECT COALESCE(SUM(minutes),0) FROM job_time_logs WHERE job_time_logs.jobId = ServiceJob.id)');
const ACTIVE = { [Op.notIn]: ['delivered', 'cancelled'] };
const isMechanic = (req) => req.user.role === ROLES.MECHANIC;

/** Customers never see internal notes or staff-only chatter. */
function present(req, j) {
  if (isCustomer(req)) {
    delete j.internalNotes; delete j.notes; delete j.timeLogs;
    j.history = (j.history ?? []).map(({ from, to, at }) => ({ from, to, at }));
  }
  return j;
}

/** Full job card with child collections (tasks, time, notes, parts, history) in the shape the API always returned. */
async function detail(id) {
  const job = await ServiceJob.findByPk(id, { include: POP });
  if (!job) return null;
  const where = { jobId: id };
  const [tasks, timeLogs, notes, partRequests, history] = await Promise.all([
    JobTask.findAll({ where, include: [{ association: 'by', attributes: ['id', 'name'] }], order: [['id', 'ASC']] }),
    JobTimeLog.findAll({ where, order: [['at', 'ASC']] }),
    JobNote.findAll({ where, include: [{ association: 'by', attributes: ['id', 'name'] }], order: [['at', 'ASC']] }),
    JobPartRequest.findAll({ where, include: [{ association: 'item', attributes: ['id', 'name', 'sku', 'quantity', 'sellingPrice'] }, { association: 'requestedBy', attributes: ['id', 'name'] }], order: [['id', 'ASC']] }),
    JobHistory.findAll({ where, include: [{ association: 'by', attributes: ['id', 'name'] }], order: [['id', 'ASC']] }),
  ]);
  const j = job.toJSON();
  const js = (a) => a.map((x) => x.toJSON());
  return { ...j, tasks: js(tasks), timeLogs: js(timeLogs), notes: js(notes), partRequests: js(partRequests), history: js(history), labourMinutes: timeLogs.reduce((s, t) => s + t.minutes, 0) };
}

/** Mechanics only touch jobs assigned to them; advisors/admins can act on any job. */
function assertWorker(req, job) {
  if (ADVISORS.includes(req.user.role)) return;
  if (isMechanic(req) && String(job.assignedMechanicId) === String(req.user.id)) return;
  throw ApiError.forbidden('This job is not assigned to you');
}

export async function listJobs(req, res) {
  const where = { ...ownerFilter(req) };
  if (isMechanic(req)) where.assignedMechanicId = req.user.id;
  else if (req.query.mechanic) where.assignedMechanicId = req.query.mechanic;
  if (req.query.status === 'active') where.status = ACTIVE;
  else if (req.query.status) where.status = req.query.status;
  if (req.query.priority) where.priority = req.query.priority;
  if (req.query.vehicle) where.vehicleId = req.query.vehicle;
  if (req.query.customer && !isCustomer(req)) where.customerId = req.query.customer;

  let search = null;
  const s = searchFilter(req.query.q, ['jobNo', 'reportedProblem']);
  if (s) {
    const vehicles = await Vehicle.findAll({ where: searchFilter(req.query.q, ['registrationNumber', 'make', 'model']), attributes: ['id'], limit: 50 });
    search = { [Op.or]: [...s[Op.or], { vehicleId: { [Op.in]: vehicles.map((v) => v.id) } }] };
  }
  const r = await paginate(ServiceJob, req, {
    where: and(where, search), order: [['checkInAt', 'DESC']],
    include: [...POP, { association: 'partRequests', attributes: ['id', 'status'], separate: true }],
    attributes: { include: [[LABOUR_SQL, 'labourMinutes']] },
  });
  list(res, { ...r, items: r.items.map((j) => present(req, j.toJSON())) });
}

export async function createJob(req, res) {
  let { customer, vehicle, services, appointment: apptId } = req.body;
  let appt = null;
  if (apptId) {
    appt = found(await Appointment.findByPk(apptId), 'Appointment');
    if (!['pending', 'confirmed'].includes(appt.status)) throw ApiError.conflict(`Appointment is ${appt.status}`);
    if (await ServiceJob.count({ where: { appointmentId: appt.id } })) throw ApiError.conflict('A job card already exists for this appointment');
    customer = appt.customerId; vehicle = appt.vehicleId;
    if (!services.length) services = [appt.serviceId];
  }
  if (!customer || !vehicle) throw ApiError.badRequest('Select a customer and vehicle, or check in from an appointment');
  const veh = found(await Vehicle.findByPk(vehicle), 'Vehicle');
  if (String(veh.customerId) !== String(customer)) throw ApiError.badRequest('Vehicle does not belong to this customer');
  if (!(await Customer.count({ where: { id: customer, isActive: true } }))) throw ApiError.badRequest('Customer is inactive or missing');
  if (await ServiceJob.count({ where: { vehicleId: vehicle, status: ACTIVE } })) throw ApiError.conflict('This vehicle already has an open job card');
  if (req.body.odometerIn < veh.odometer) throw ApiError.badRequest(`Odometer cannot be lower than the last recorded reading (${veh.odometer} km)`);
  if (req.body.assignedMechanic && !(await User.count({ where: { id: req.body.assignedMechanic, role: ROLES.MECHANIC, isActive: true } }))) throw ApiError.badRequest('Selected user is not an active mechanic');

  const jobNo = await nextNumber('JOB', 'JC');
  const { assignedMechanic, appointment: _a, services: _s, customer: _c, vehicle: _v, ...fields } = req.body;
  const job = await sequelize.transaction(async (transaction) => {
    const j = await ServiceJob.create({ ...fields, jobNo, customerId: customer, vehicleId: vehicle, appointmentId: appt?.id ?? null, assignedMechanicId: assignedMechanic ?? null }, { transaction });
    await j.setServices(services, { transaction });
    await JobHistory.create({ jobId: j.id, to: 'checked_in', byId: req.user.id, note: 'Vehicle checked in' }, { transaction });
    if (appt) {
      appt.status = 'checked_in';
      appt.history = [...(appt.history ?? []), { status: 'checked_in', by: req.user.id, at: new Date() }];
      await appt.save({ transaction });
    }
    if (req.body.odometerIn > veh.odometer) await veh.update({ odometer: req.body.odometerIn }, { transaction });
    return j;
  });
  await audit(req, 'job.create', { type: 'ServiceJob', id: job.id }, `Checked in ${veh.registrationNumber} as ${job.jobNo}`);
  if (job.assignedMechanicId) notifyAssignment(job, job.assignedMechanicId);
  created(res, await detail(job.id));
}

export async function getJob(req, res) {
  const j = await detail(req.params.id);
  assertAccess(req, j);
  if (isMechanic(req)) assertWorker(req, j);
  ok(res, present(req, j));
}

export async function updateJob(req, res) {
  const job = found(await ServiceJob.findByPk(req.params.id), 'Job');
  if (['delivered', 'cancelled'].includes(job.status)) throw ApiError.conflict(`A ${job.status} job cannot be edited`);
  const prevMech = job.assignedMechanicId;
  if (req.body.assignedMechanic && !(await User.count({ where: { id: req.body.assignedMechanic, role: ROLES.MECHANIC, isActive: true } }))) throw ApiError.badRequest('Selected user is not an active mechanic');
  await job.update(toFk(req.body, ['assignedMechanic']));
  await audit(req, 'job.update', { type: 'ServiceJob', id: job.id }, `Updated ${job.jobNo}`, req.body);
  if (job.assignedMechanicId && job.assignedMechanicId !== prevMech) notifyAssignment(job, job.assignedMechanicId);
  ok(res, await detail(job.id));
}

export async function transition(req, res) {
  const job = assertAccess(req, await ServiceJob.findByPk(req.params.id));
  const from = job.status;
  await transitionJob(job, req.body.to, req, req.body.note);
  await audit(req, 'job.status_change', { type: 'ServiceJob', id: job.id }, `${job.jobNo}: ${from} -> ${job.status}`);
  ok(res, await detail(job.id));
}

// ── Mechanic workspace actions ───────────────────────────────
async function workableJob(req) {
  const job = found(await ServiceJob.findByPk(req.params.id), 'Job');
  assertWorker(req, job);
  if (['delivered', 'cancelled', 'invoiced'].includes(job.status)) throw ApiError.conflict(`Job is ${job.status}`);
  return job;
}
const needInProgress = (job) => { if (job.status !== 'in_progress') throw ApiError.conflict('Work can only be recorded while the job is in progress'); };

export async function addTask(req, res) {
  const job = await workableJob(req);
  needInProgress(job);
  await JobTask.create({ jobId: job.id, description: req.body.description, byId: req.user.id });
  ok(res, await detail(job.id));
}

export async function setTaskDone(req, res) {
  const job = await workableJob(req);
  needInProgress(job);
  const task = found(await JobTask.findOne({ where: { id: req.params.taskId, jobId: job.id } }), 'Task');
  await task.update({ done: req.body.done, doneAt: req.body.done ? new Date() : null, byId: req.user.id });
  ok(res, await detail(job.id));
}

export async function addTimeLog(req, res) {
  const job = await workableJob(req);
  needInProgress(job);
  await JobTimeLog.create({ jobId: job.id, mechanicId: req.user.id, minutes: req.body.minutes, note: req.body.note });
  ok(res, await detail(job.id));
}

export async function addNote(req, res) {
  const job = await workableJob(req);
  await JobNote.create({ jobId: job.id, byId: req.user.id, text: req.body.text });
  ok(res, await detail(job.id));
}

export async function requestPart(req, res) {
  const job = await workableJob(req);
  if (!['approved', 'in_progress'].includes(job.status)) throw ApiError.conflict('Parts can be requested once the estimate is approved');
  const item = found(await InventoryItem.findOne({ where: { id: req.body.item, isActive: true } }), 'Part');
  await JobPartRequest.create({ jobId: job.id, itemId: item.id, quantity: req.body.quantity, note: req.body.note, requestedById: req.user.id });
  safe(notifyRoles(STOCK_ROLES, { type: 'parts.requested', title: 'Spare part requested', message: `${job.jobNo}: ${req.body.quantity} × ${item.name}`, link: '/app/inventory' }));
  ok(res, await detail(job.id));
}

/** Inventory manager issues a requested part → stock-out + request update in ONE transaction. */
export async function resolvePart(req, res) {
  const job = found(await ServiceJob.findByPk(req.params.id), 'Job');
  const pr = found(await JobPartRequest.findOne({ where: { id: req.params.reqId, jobId: job.id } }), 'Part request');
  if (pr.status !== 'requested') throw ApiError.conflict(`Request already ${pr.status}`);
  await sequelize.transaction(async (transaction) => {
    // re-read under lock so two managers can't both resolve the same request
    const fresh = await JobPartRequest.findByPk(pr.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (fresh.status !== 'requested') throw ApiError.conflict(`Request already ${fresh.status}`);
    if (req.body.action === 'issue') {
      const { item } = await applyMovement({
        itemId: fresh.itemId, type: 'out', quantity: fresh.quantity, reason: 'job_issue', by: req.user.id,
        note: `Issued to ${job.jobNo}`, reference: { kind: 'ServiceJob', id: job.id }, transaction,
      });
      fresh.status = 'issued';
      fresh.unitCost = item.purchasePrice;
    } else fresh.status = 'rejected';
    fresh.resolvedById = req.user.id;
    fresh.resolvedAt = new Date();
    if (req.body.note) fresh.note = req.body.note;
    await fresh.save({ transaction });
    pr.status = fresh.status;
  });
  await audit(req, `parts.${pr.status}`, { type: 'ServiceJob', id: job.id }, `${job.jobNo}: part request ${pr.status}`);
  if (job.assignedMechanicId) safe(notifyUsers([job.assignedMechanicId], { type: 'parts.resolved', title: `Part request ${pr.status}`, message: job.jobNo, link: `/app/service-jobs/${job.id}` }));
  ok(res, await detail(job.id));
}

export async function qualityCheck(req, res) {
  const job = found(await ServiceJob.findByPk(req.params.id), 'Job');
  if (job.status !== 'quality_check') throw ApiError.conflict('Job is not waiting for a quality check');
  job.qualityCheck = { passed: req.body.passed, notes: req.body.notes, by: req.user.id, at: new Date() };
  await setJobStatus(job, req.body.passed ? 'completed' : 'in_progress', req, req.body.passed ? 'Quality check passed' : `Quality check failed: ${req.body.notes ?? ''}`);
  await audit(req, 'job.quality_check', { type: 'ServiceJob', id: job.id }, `${job.jobNo} quality check ${req.body.passed ? 'passed' : 'failed'}`);
  if (!req.body.passed && job.assignedMechanicId) safe(notifyUsers([job.assignedMechanicId], { type: 'job.rework', title: 'Quality check failed', message: `${job.jobNo}: ${req.body.notes ?? 'see notes'}`, link: `/app/service-jobs/${job.id}` }));
  ok(res, await detail(job.id));
}
