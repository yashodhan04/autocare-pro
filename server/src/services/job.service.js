import { Estimate, Invoice, Vehicle, MaintenancePlan, Appointment, JobHistory, JobTask, JobTimeLog, JobPartRequest } from '../models/index.js';
import { Op } from 'sequelize';
import { ROLES, ADVISORS, ADMINS } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { notifyCustomer, notifyUsers, safe } from './notification.service.js';

const DAY = 86_400_000;

/**
 * Manual transitions (everything else is driven by a dedicated action):
 *   inspection / awaiting_estimate  <- inspection record saved
 *   awaiting_approval / approved    <- estimate submitted / approved
 *   completed                        <- quality check passed
 *   invoiced                         <- invoice created
 */
export const MANUAL_TRANSITIONS = {
  checked_in: { inspection: [...ADVISORS, ROLES.MECHANIC], cancelled: ADVISORS },
  inspection: { cancelled: ADVISORS },
  awaiting_estimate: { cancelled: ADVISORS },
  awaiting_approval: { cancelled: ADVISORS },
  approved: { in_progress: [...ADVISORS, ROLES.MECHANIC], cancelled: ADVISORS },
  in_progress: { quality_check: [...ADVISORS, ROLES.MECHANIC], cancelled: ADMINS },
  quality_check: { in_progress: ADVISORS, cancelled: ADMINS },
  completed: { cancelled: ADMINS },
  invoiced: { delivered: [...ADVISORS, ROLES.CASHIER] },
};

const LABEL = {
  inspection: 'Inspection started', awaiting_estimate: 'Awaiting estimate', awaiting_approval: 'Estimate awaiting your approval',
  approved: 'Estimate approved', in_progress: 'Repair work in progress', quality_check: 'Under quality check',
  completed: 'Service completed', invoiced: 'Invoice issued', delivered: 'Vehicle delivered', cancelled: 'Job cancelled',
};

const CUSTOMER_VISIBLE = ['inspection', 'in_progress', 'quality_check', 'completed', 'delivered', 'cancelled'];

/** Move a job to a new status, write history and notify. No guards — callers enforce rules. */
export async function setJobStatus(job, to, req, note) {
  const from = job.status;
  job.status = to;
  if (to === 'in_progress' && !job.workStartedAt) job.workStartedAt = new Date();
  if (to === 'completed') job.completedAt = new Date();
  if (to === 'delivered') job.deliveredAt = new Date();
  await job.save();
  await JobHistory.create({ jobId: job.id, from, to, byId: req.user?.id, note });
  if (CUSTOMER_VISIBLE.includes(to) || to === 'invoiced') {
    safe(notifyCustomer(job.customerId, {
      type: to === 'completed' ? 'job.completed' : 'job.progress', title: LABEL[to], message: `${job.jobNo}: ${LABEL[to]}`, link: '/app/service-jobs',
    }));
  }
  return job;
}

/** Guarded manual transition used by POST /jobs/:id/transition. */
export async function transitionJob(job, to, req, note) {
  const rule = MANUAL_TRANSITIONS[job.status]?.[to];
  if (!rule) throw ApiError.conflict(`A job in "${job.status}" cannot move to "${to}" this way`);
  if (!rule.includes(req.user.role)) throw ApiError.forbidden(`Your role cannot move a job to "${to}"`);

  if (req.user.role === ROLES.MECHANIC && String(job.assignedMechanicId) !== String(req.user.id)) throw ApiError.forbidden('This job is not assigned to you');

  if (to === 'inspection' && !job.assignedMechanic) { /* allowed: inspection can start before assignment */ }

  if (to === 'in_progress' && job.status === 'approved') {
    const approved = await Estimate.count({ where: { jobId: job.id, status: 'approved' } });
    if (!approved) throw ApiError.conflict('Work cannot start until an estimate has been approved by the customer');
    if (!job.assignedMechanicId) throw ApiError.conflict('Assign a mechanic before starting work');
  }
  if (to === 'quality_check') {
    const [tasks, minutes, pending] = await Promise.all([
      JobTask.count({ where: { jobId: job.id } }), JobTimeLog.count({ where: { jobId: job.id } }),
      JobPartRequest.count({ where: { jobId: job.id, status: 'requested' } }),
    ]);
    if (!tasks && !minutes) throw ApiError.conflict('Record at least one task or labour time before submitting for quality check');
    if (pending) throw ApiError.conflict('Resolve pending spare-part requests first');
  }
  if (to === 'delivered') {
    const inv = await Invoice.findOne({ where: { jobId: job.id, status: { [Op.ne]: 'void' } } });
    if (!inv || inv.status !== 'paid') throw ApiError.conflict('The invoice must be fully paid before the vehicle is delivered');
  }
  if (to === 'cancelled') {
    if (await Invoice.count({ where: { jobId: job.id, status: { [Op.ne]: 'void' } } })) throw ApiError.conflict('Void the invoice before cancelling this job');
    await Estimate.update({ status: 'superseded' }, { where: { jobId: job.id, status: { [Op.in]: ['draft', 'pending_approval'] } } });
  }

  await setJobStatus(job, to, req, note);
  if (to === 'delivered') await onDelivered(job, req);
  return job;
}

/** Delivery closes the loop: odometer, appointment, and maintenance plan rollover. */
async function onDelivered(job) {
  const vehicle = await Vehicle.findByPk(job.vehicleId);
  if (vehicle && job.odometerIn > vehicle.odometer) { vehicle.odometer = job.odometerIn; await vehicle.save(); }
  if (job.appointmentId) await Appointment.update({ status: 'completed' }, { where: { id: job.appointmentId } });

  const plans = await MaintenancePlan.findAll({ where: { vehicleId: job.vehicleId, isActive: true } });
  const now = new Date();
  await Promise.all(plans.map((p) => {
    p.lastServiceDate = now;
    p.lastServiceOdometer = job.odometerIn;
    p.nextDueDate = p.intervalDays ? new Date(+now + p.intervalDays * DAY) : null;
    p.nextDueOdometer = p.intervalKm ? job.odometerIn + p.intervalKm : null;
    return p.save();
  }));
  safe(notifyCustomer(job.customerId, { type: 'review.invite', title: 'How did we do?', message: `Tell us about job ${job.jobNo}`, link: '/app/reviews' }));
}

/** A plan is due when its date has passed (or is within `soonDays`) or the odometer reached the target. */
export function planDueState(plan, odometer, soonDays = 14) {
  const reasons = [];
  if (plan.nextDueDate) {
    const days = Math.ceil((+plan.nextDueDate - Date.now()) / DAY);
    if (days < 0) reasons.push(`overdue by ${-days} day(s)`);
    else if (days <= soonDays) reasons.push(`due in ${days} day(s)`);
  }
  if (plan.nextDueOdometer != null && odometer != null) {
    const km = plan.nextDueOdometer - odometer;
    if (km <= 0) reasons.push(`odometer passed by ${-km} km`);
    else if (km <= 500) reasons.push(`due in ${km} km`);
  }
  return reasons;
}

/** Assigning a mechanic notifies them. */
export const notifyAssignment = (job, mechanicId) =>
  safe(notifyUsers([mechanicId], { type: 'job.assigned', title: 'New job assigned', message: `${job.jobNo} has been assigned to you`, link: `/app/service-jobs/${job.id}` }));

