import { Op, fn, col } from 'sequelize';
import { Estimate, ServiceJob, Inspection, InventoryItem } from '../models/index.js';
import { ADVISORS } from '../config/constants.js';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, ok, created, list } from '../utils/pagination.js';
import { nextNumber } from '../utils/sequence.js';
import { ownerFilter, isCustomer } from '../middleware/auth.js';
import { audit } from '../services/audit.service.js';
import { applyEstimateTotals } from '../services/estimate.service.js';
import { setJobStatus } from '../services/job.service.js';
import { notifyCustomer, notifyRoles, notifyUsers, safe } from '../services/notification.service.js';
import { assertAccess, found } from './helpers.js';

const POP = [
  { association: 'job', attributes: ['id', 'jobNo', 'status', 'assignedMechanicId'] },
  { association: 'vehicle', attributes: ['id', 'registrationNumber', 'make', 'model'] },
  { association: 'customer', attributes: ['id', 'name'] },
  { association: 'createdBy', attributes: ['id', 'name'] },
];
const OPEN = ['draft', 'pending_approval'];
const ESTIMATE_JOB_STATES = ['inspection', 'awaiting_estimate', 'awaiting_approval', 'approved', 'in_progress'];
const load = (id) => Estimate.findByPk(id, { include: POP });
const addDecision = (est, d) => { est.decisions = [...(est.decisions ?? []), { ...d, at: new Date() }]; };
const who = (u) => ({ _id: String(u.id), name: u.name });

export async function listEstimates(req, res) {
  const where = { ...ownerFilter(req) };
  if (isCustomer(req)) where.status = { [Op.ne]: 'draft' }; // customers never see drafts
  if (req.query.status) where.status = req.query.status;
  if (req.query.job) where.jobId = req.query.job;
  list(res, await paginate(Estimate, req, { where, include: POP }));
}

export async function getEstimate(req, res) {
  const e = assertAccess(req, await load(req.params.id));
  if (isCustomer(req) && e.status === 'draft') throw ApiError.notFound();
  ok(res, e);
}

async function checkPartLines(lines) {
  const ids = [...new Set(lines.filter((l) => l.kind === 'part' && l.inventoryItem).map((l) => l.inventoryItem))];
  if (!ids.length) return;
  if ((await InventoryItem.count({ where: { id: { [Op.in]: ids } } })) !== ids.length) throw ApiError.badRequest('One or more parts no longer exist');
}

/** Create a new estimate or the next revision of an existing job's estimate. */
export async function createEstimate(req, res) {
  const job = found(await ServiceJob.findByPk(req.body.job), 'Job');
  if (!(await Inspection.count({ where: { jobId: job.id } }))) throw ApiError.conflict('Record the vehicle inspection before preparing an estimate');
  if (!ESTIMATE_JOB_STATES.includes(job.status)) throw ApiError.conflict(`Estimates cannot be created while the job is ${job.status}`);
  if (await Estimate.count({ where: { jobId: job.id, status: { [Op.in]: OPEN } } })) throw ApiError.conflict('Finish or discard the open estimate revision first');
  await checkPartLines(req.body.lines);

  const last = await Estimate.findOne({ where: { jobId: job.id }, attributes: [[fn('MAX', col('revision')), 'revision']], raw: true });
  const { lines, taxRate, discount, notes, recommendations } = req.body;
  const est = Estimate.build({
    estimateNo: await nextNumber('EST', 'ES'), jobId: job.id, customerId: job.customerId, vehicleId: job.vehicleId,
    revision: (last?.revision ?? 0) + 1, notes, recommendations, createdById: req.user.id,
  });
  applyEstimateTotals(est, { lines, taxRate: taxRate ?? config.defaultTaxRate, discount });
  await est.save();
  await audit(req, 'estimate.create', { type: 'Estimate', id: est.id }, `${est.estimateNo} rev ${est.revision} drafted for ${job.jobNo}`, { total: est.total });
  created(res, await load(est.id));
}

export async function updateEstimate(req, res) {
  const est = found(await Estimate.findByPk(req.params.id), 'Estimate');
  if (est.status !== 'draft') throw ApiError.conflict('Only draft estimates can be edited. Create a revision instead.');
  await checkPartLines(req.body.lines);
  const { lines, taxRate, discount, notes, recommendations } = req.body;
  applyEstimateTotals(est, { lines, taxRate, discount });
  est.notes = notes ?? null; est.recommendations = recommendations ?? null;
  await est.save();
  await audit(req, 'estimate.update', { type: 'Estimate', id: est.id }, `${est.estimateNo} rev ${est.revision} edited`, { total: est.total });
  ok(res, await load(est.id));
}

export async function discardEstimate(req, res) {
  const est = found(await Estimate.findByPk(req.params.id), 'Estimate');
  if (est.status !== 'draft') throw ApiError.conflict('Only drafts can be discarded');
  await est.destroy();
  await audit(req, 'estimate.discard', { type: 'Estimate', id: est.id }, `${est.estimateNo} draft discarded`);
  ok(res, { deleted: true });
}

/** Send to customer. A revision on a job that already has work underway pauses the job for re-approval. */
export async function submitEstimate(req, res) {
  const est = found(await Estimate.findByPk(req.params.id), 'Estimate');
  if (est.status !== 'draft') throw ApiError.conflict('Estimate has already been submitted');
  if (!est.lines.length || !(est.total > 0)) throw ApiError.badRequest('An estimate needs at least one priced line');
  const job = await ServiceJob.findByPk(est.jobId);
  if (!['awaiting_estimate', 'approved', 'in_progress'].includes(job.status)) throw ApiError.conflict(`Cannot submit an estimate while the job is ${job.status}`);

  est.status = 'pending_approval';
  addDecision(est, { action: 'submitted', by: who(req.user) });
  await est.save();
  job.resumeStatus = job.status === 'awaiting_estimate' ? 'approved' : job.status;
  await setJobStatus(job, 'awaiting_approval', req, `Estimate ${est.estimateNo} rev ${est.revision} sent for approval`);
  await audit(req, 'estimate.submit', { type: 'Estimate', id: est.id }, `${est.estimateNo} rev ${est.revision} sent for approval`, { total: est.total });
  safe(notifyCustomer(est.customerId, { type: 'estimate.approval_requested', title: 'Estimate awaiting your approval', message: `${est.estimateNo} (rev ${est.revision}) — total ₹${est.total}`, link: '/app/estimates' }));
  ok(res, await load(est.id));
}

/** Approve / reject. Customers decide for themselves; advisors may record a decision on the customer's behalf. */
export async function decide(req, res) {
  const est = assertAccess(req, await Estimate.findByPk(req.params.id));
  if (est.status !== 'pending_approval') throw ApiError.conflict(`Estimate is ${est.status}, not awaiting approval`);
  const onBehalf = !isCustomer(req);
  if (onBehalf && !req.body.note) throw ApiError.badRequest('Add a note explaining how the customer approved (e.g. "phone call")');

  const job = await ServiceJob.findByPk(est.jobId);
  const approve = req.body.decision === 'approve';
  est.status = approve ? 'approved' : 'rejected';
  addDecision(est, { action: approve ? 'approved' : 'rejected', by: who(req.user), onBehalf, note: req.body.note });
  await est.save();

  if (approve) {
    await Estimate.update({ status: 'superseded' }, { where: { jobId: job.id, status: 'approved', id: { [Op.ne]: est.id } } });
    await setJobStatus(job, job.resumeStatus || 'approved', req, `Estimate ${est.estimateNo} rev ${est.revision} approved`);
  } else {
    const inForce = await Estimate.count({ where: { jobId: job.id, status: 'approved' } });
    await setJobStatus(job, inForce ? job.resumeStatus || 'approved' : 'awaiting_estimate', req, `Estimate ${est.estimateNo} rev ${est.revision} rejected`);
  }
  job.resumeStatus = null;
  await job.save();

  await audit(req, `estimate.${approve ? 'approve' : 'reject'}`, { type: 'Estimate', id: est.id }, `${est.estimateNo} rev ${est.revision} ${est.status}${onBehalf ? ' (on behalf of customer)' : ''}`, { note: req.body.note });
  const payload = { type: 'estimate.decision', title: `Estimate ${est.status}`, message: `${job.jobNo}: ${est.estimateNo} rev ${est.revision} ${est.status}`, link: `/app/service-jobs/${job.id}` };
  safe(notifyRoles(ADVISORS, payload));
  if (job.assignedMechanicId && approve) safe(notifyUsers([job.assignedMechanicId], payload));
  ok(res, await load(est.id));
}
