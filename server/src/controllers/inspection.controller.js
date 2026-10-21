import { Op } from 'sequelize';
import { Inspection, ServiceJob } from '../models/index.js';
import { DEFAULT_CHECKLIST } from '../config/constants.js';
import { ROLES, ADVISORS } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, ok, created, list } from '../utils/pagination.js';
import { ownerFilter } from '../middleware/auth.js';
import { audit } from '../services/audit.service.js';
import { setJobStatus } from '../services/job.service.js';
import { notifyCustomer, safe } from '../services/notification.service.js';
import { assertAccess, found } from './helpers.js';

const POP = [
  { association: 'job', attributes: ['id', 'jobNo', 'status'] },
  { association: 'vehicle', attributes: ['id', 'registrationNumber', 'make', 'model'] },
  { association: 'inspector', attributes: ['id', 'name'] },
  { association: 'customer', attributes: ['id', 'name'] },
];

export const checklistTemplate = (_req, res) => ok(res, DEFAULT_CHECKLIST);

export async function listInspections(req, res) {
  const where = { ...ownerFilter(req) };
  if (req.query.job) where.jobId = req.query.job;
  if (req.user.role === ROLES.MECHANIC) {
    const mine = await ServiceJob.findAll({ where: { assignedMechanicId: req.user.id }, attributes: ['id'] });
    where.jobId = { [Op.in]: mine.map((j) => j.id) };
  }
  list(res, await paginate(Inspection, req, { where, include: POP, order: [['inspectedAt', 'DESC']] }));
}

export async function getInspection(req, res) {
  ok(res, assertAccess(req, await Inspection.findByPk(req.params.id, { include: POP })));
}

/** Saving an inspection links it to the job and advances the job to "awaiting estimate". */
export async function createInspection(req, res) {
  const job = found(await ServiceJob.findByPk(req.body.job), 'Job');
  if (req.user.role === ROLES.MECHANIC && String(job.assignedMechanicId) !== String(req.user.id)) throw ApiError.forbidden('This job is not assigned to you');
  if (!['checked_in', 'inspection', 'awaiting_estimate'].includes(job.status)) throw ApiError.conflict(`Inspection cannot be recorded while the job is ${job.status}`);

  const { job: _j, ...fields } = req.body;
  const insp = await Inspection.create({ ...fields, jobId: job.id, vehicleId: job.vehicleId, customerId: job.customerId, inspectorId: req.user.id });
  if (job.status !== 'awaiting_estimate') await setJobStatus(job, 'awaiting_estimate', req, 'Inspection recorded');
  await audit(req, 'inspection.create', { type: 'Inspection', id: insp.id }, `Inspection recorded for ${job.jobNo}`);
  const failures = req.body.items.filter((i) => i.status !== 'pass').length;
  safe(notifyCustomer(job.customerId, { type: 'inspection.done', title: 'Inspection completed', message: `${job.jobNo}: ${failures} item(s) need attention`, link: '/app/inspections' }));
  created(res, await Inspection.findByPk(insp.id, { include: POP }));
}

export async function updateInspection(req, res) {
  const insp = found(await Inspection.findByPk(req.params.id), 'Inspection');
  if (req.user.role === ROLES.MECHANIC && String(insp.inspectorId) !== String(req.user.id)) throw ApiError.forbidden('You can only edit your own inspections');
  if (!ADVISORS.includes(req.user.role) && req.user.role !== ROLES.MECHANIC) throw ApiError.forbidden();
  const { job: _j, ...data } = req.body;
  await insp.update(data);
  await audit(req, 'inspection.update', { type: 'Inspection', id: insp.id }, 'Inspection updated');
  ok(res, await Inspection.findByPk(insp.id, { include: POP }));
}
