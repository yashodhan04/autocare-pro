import { Op } from 'sequelize';
import { Vehicle, ServiceJob, Invoice, MaintenancePlan, Inspection, Estimate } from '../models/index.js';
import { paginate, searchFilter, and, ok, created, list } from '../utils/pagination.js';
import { audit } from '../services/audit.service.js';
import { ownerFilter, isCustomer } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';
import { assertAccess, found, cleanBool, toFk } from './helpers.js';
import { planDueState } from '../services/job.service.js';

const OWNER = { association: 'customer', attributes: ['id', 'name', 'phone'] };

export async function listVehicles(req, res) {
  const where = { ...ownerFilter(req) };
  if (req.query.customer && !isCustomer(req)) where.customerId = req.query.customer;
  where.isActive = cleanBool(req.query.active) ?? true;
  if (req.query.fuelType) where.fuelType = req.query.fuelType;
  list(res, await paginate(Vehicle, req, { where: and(where, searchFilter(req.query.q, ['registrationNumber', 'make', 'model', 'vin'])), include: [OWNER] }));
}

export async function createVehicle(req, res) {
  const data = toFk(req.body, ['customer']);
  if (isCustomer(req)) {
    if (!req.customerId) throw ApiError.badRequest('Your customer profile is missing');
    data.customerId = req.customerId;
  } else if (!data.customerId) throw ApiError.badRequest('customer is required');
  const v = await Vehicle.create(data);
  await audit(req, 'vehicle.create', { type: 'Vehicle', id: v.id }, `Registered vehicle ${v.registrationNumber}`);
  created(res, await Vehicle.findByPk(v.id, { include: [OWNER] }));
}

export async function getVehicle(req, res) {
  ok(res, assertAccess(req, await Vehicle.findByPk(req.params.id, { include: [OWNER] })));
}

export async function updateVehicle(req, res) {
  const v = assertAccess(req, await Vehicle.findByPk(req.params.id));
  const { customer: _ignored, ...data } = req.body; // ownership transfer is not allowed via edit
  if (data.odometer !== undefined && data.odometer < v.odometer && isCustomer(req)) throw ApiError.badRequest('Odometer cannot be lower than the last recorded reading');
  await v.update(data);
  await audit(req, 'vehicle.update', { type: 'Vehicle', id: v.id }, `Updated vehicle ${v.registrationNumber}`, data);
  ok(res, await Vehicle.findByPk(v.id, { include: [OWNER] }));
}

export async function deactivateVehicle(req, res) {
  const v = assertAccess(req, await Vehicle.findByPk(req.params.id));
  const open = await ServiceJob.count({ where: { vehicleId: v.id, status: { [Op.notIn]: ['delivered', 'cancelled'] } } });
  if (open) throw ApiError.conflict('Vehicle has an open service job');
  await v.update({ isActive: false });
  await audit(req, 'vehicle.deactivate', { type: 'Vehicle', id: v.id }, `Deactivated vehicle ${v.registrationNumber}`);
  ok(res, v);
}

/** Service history: completed work, parts replaced, odometer, invoices, plans, open recommendations. */
export async function vehicleHistory(req, res) {
  const v = assertAccess(req, await Vehicle.findByPk(req.params.id, { include: [OWNER] }));
  const jobs = await ServiceJob.findAll({
    where: { vehicleId: v.id, status: { [Op.in]: ['delivered', 'invoiced', 'completed'] } },
    include: [
      { association: 'services', attributes: ['id', 'name'], through: { attributes: [] } },
      { association: 'partRequests', where: { status: 'issued' }, required: false, include: [{ association: 'item', attributes: ['id', 'name', 'sku'] }] },
    ],
    order: [['checkInAt', 'DESC']], limit: 50,
  });
  const jobIds = jobs.map((j) => j.id);
  const [invoices, plans, inspection, estimates] = await Promise.all([
    Invoice.findAll({ where: { jobId: { [Op.in]: jobIds } }, attributes: ['id', 'jobId', 'invoiceNo', 'total', 'status', 'issuedAt'] }),
    MaintenancePlan.findAll({ where: { vehicleId: v.id, isActive: true } }),
    Inspection.findOne({ where: { vehicleId: v.id }, order: [['inspectedAt', 'DESC']] }),
    Estimate.findAll({ where: { jobId: { [Op.in]: jobIds }, status: 'approved' }, attributes: ['jobId', 'lines'] }),
  ]);
  const invByJob = new Map(invoices.map((i) => [i.jobId, i]));
  const estByJob = new Map(estimates.map((e) => [e.jobId, e]));
  const history = jobs.map((j) => ({
    jobId: j.id, _id: String(j.id), jobNo: j.jobNo, date: j.checkInAt, odometer: j.odometerIn, problem: j.reportedProblem,
    services: j.services.map((s) => s.name),
    work: (estByJob.get(j.id)?.lines ?? []).filter((l) => l.kind === 'labour').map((l) => l.description),
    partsReplaced: j.partRequests.map((p) => ({ name: p.item?.name, sku: p.item?.sku, quantity: p.quantity })),
    invoice: invByJob.get(j.id) ?? null,
  }));
  const recommendations = (inspection?.recommendedRepairs ?? []).map((r) => ({ ...r, source: 'inspection' }));
  ok(res, { vehicle: v, history, plans: plans.map((p) => ({ ...p.toJSON(), dueReasons: planDueState(p, v.odometer) })), recommendations });
}

