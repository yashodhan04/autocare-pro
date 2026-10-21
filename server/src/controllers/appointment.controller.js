import { Op } from 'sequelize';
import { Appointment, ServiceCatalog, Vehicle } from '../models/index.js';
import { ADVISORS } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, ok, created, list } from '../utils/pagination.js';
import { nextNumber } from '../utils/sequence.js';
import { ownerFilter, isCustomer } from '../middleware/auth.js';
import { audit } from '../services/audit.service.js';
import { notifyRoles, notifyCustomer, safe } from '../services/notification.service.js';
import { assertSlotAvailable, recheckAfterInsert, daySlots } from '../services/appointment.service.js';
import { assertAccess, found } from './helpers.js';

const POP = [
  { association: 'customer', attributes: ['id', 'name', 'phone'] },
  { association: 'vehicle', attributes: ['id', 'registrationNumber', 'make', 'model'] },
  { association: 'service', attributes: ['id', 'name', 'estimatedDurationMinutes', 'estimatedPrice'] },
];
const CUSTOMER_CHANGE_CUTOFF_MS = 2 * 60 * 60 * 1000;
const fmt = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const load = (id) => Appointment.findByPk(id, { include: POP });
const pushHistory = (a, entry) => { a.history = [...(a.history ?? []), { ...entry, at: new Date() }]; };

export async function listAppointments(req, res) {
  const where = { ...ownerFilter(req) };
  if (req.query.status) where.status = req.query.status;
  if (req.query.vehicle) where.vehicleId = req.query.vehicle;
  if (req.query.from || req.query.to) {
    where.start = {};
    if (req.query.from) where.start[Op.gte] = new Date(req.query.from);
    if (req.query.to) where.start[Op.lte] = new Date(req.query.to);
  }
  list(res, await paginate(Appointment, req, { where, include: POP, order: [['start', req.query.sort === 'asc' ? 'ASC' : 'DESC']] }));
}

export async function availability(req, res) {
  const service = found(await ServiceCatalog.findByPk(req.query.service), 'Service');
  ok(res, await daySlots(String(req.query.date ?? ''), service));
}

export async function createAppointment(req, res) {
  const { vehicle: vehicleId, service: serviceId, start, issue } = req.body;
  const vehicle = found(await Vehicle.findByPk(vehicleId), 'Vehicle');
  if (isCustomer(req) && String(vehicle.customerId) !== String(req.customerId)) throw ApiError.forbidden('You can only book for your own vehicles');
  const service = found(await ServiceCatalog.findByPk(serviceId), 'Service');
  const { end } = await assertSlotAvailable({ start, service, vehicleId });

  const staffBooked = !isCustomer(req);
  const status = staffBooked ? 'confirmed' : 'pending';
  const appt = await Appointment.create({
    appointmentNo: await nextNumber('APPT', 'AP'),
    customerId: vehicle.customerId, vehicleId: vehicle.id, serviceId: service.id, start, end, issue,
    status, createdById: req.user.id, history: [{ status, by: req.user.id, at: new Date() }],
  });
  if (!(await recheckAfterInsert(appt))) {
    await appt.destroy();
    throw ApiError.conflict('That time was just taken. Please choose another slot.');
  }
  await audit(req, 'appointment.create', { type: 'Appointment', id: appt.id }, `Booked ${service.name} for ${fmt(start)}`);
  if (isCustomer(req)) safe(notifyRoles(ADVISORS, { type: 'appointment.new', title: 'New appointment request', message: `${service.name} on ${fmt(start)}`, link: '/app/appointments' }));
  else safe(notifyCustomer(vehicle.customerId, { type: 'appointment.confirmed', title: 'Appointment confirmed', message: `${service.name} on ${fmt(start)}`, link: '/app/appointments' }));
  created(res, await load(appt.id));
}

export async function reschedule(req, res) {
  const appt = assertAccess(req, await Appointment.findByPk(req.params.id));
  if (!['pending', 'confirmed'].includes(appt.status)) throw ApiError.conflict(`A ${appt.status} appointment cannot be rescheduled`);
  if (isCustomer(req) && +appt.start - Date.now() < CUSTOMER_CHANGE_CUTOFF_MS) throw ApiError.conflict('Appointments can only be changed up to 2 hours before the start time. Please call the workshop.');
  const service = found(await ServiceCatalog.findByPk(appt.serviceId), 'Service');
  const { end } = await assertSlotAvailable({ start: req.body.start, service, vehicleId: appt.vehicleId, excludeId: appt.id });

  const previous = appt.start;
  appt.start = req.body.start;
  appt.end = end;
  if (isCustomer(req)) appt.status = 'pending'; // staff must re-confirm customer-initiated changes
  pushHistory(appt, { status: appt.status, by: req.user.id, note: `Rescheduled from ${fmt(previous)}` });
  await appt.save();
  await audit(req, 'appointment.reschedule', { type: 'Appointment', id: appt.id }, `Rescheduled to ${fmt(appt.start)}`);
  if (isCustomer(req)) safe(notifyRoles(ADVISORS, { type: 'appointment.changed', title: 'Appointment rescheduled', message: `Customer moved booking to ${fmt(appt.start)}`, link: '/app/appointments' }));
  else safe(notifyCustomer(appt.customerId, { type: 'appointment.changed', title: 'Appointment rescheduled', message: `Your booking is now ${fmt(appt.start)}`, link: '/app/appointments' }));
  ok(res, await load(appt.id));
}

const STATUS_RULES = { confirmed: ['pending'], rejected: ['pending'], cancelled: ['pending', 'confirmed'], no_show: ['confirmed'] };

async function setStatus(req, appt, status, reason) {
  if (!STATUS_RULES[status].includes(appt.status)) throw ApiError.conflict(`Cannot move a ${appt.status} appointment to ${status}`);
  if (status === 'rejected' && !reason) throw ApiError.badRequest('Please give a reason for rejecting');
  appt.status = status;
  appt.statusReason = reason ?? null;
  pushHistory(appt, { status, by: req.user.id, note: reason });
  await appt.save();
  await audit(req, `appointment.${status}`, { type: 'Appointment', id: appt.id }, `Appointment ${appt.appointmentNo} ${status}`, { reason });
  const titles = { confirmed: 'Appointment confirmed', rejected: 'Appointment declined', cancelled: 'Appointment cancelled', no_show: 'Appointment missed' };
  if (isCustomer(req)) safe(notifyRoles(ADVISORS, { type: `appointment.${status}`, title: `Appointment ${status}`, message: appt.appointmentNo, link: '/app/appointments' }));
  else safe(notifyCustomer(appt.customerId, { type: `appointment.${status}`, title: titles[status], message: `${fmt(appt.start)}${reason ? ` — ${reason}` : ''}`, link: '/app/appointments' }));
}

/** Staff: confirm / reject / cancel / no-show. */
export async function updateStatus(req, res) {
  const appt = found(await Appointment.findByPk(req.params.id), 'Appointment');
  await setStatus(req, appt, req.body.status, req.body.reason);
  ok(res, await load(appt.id));
}

/** Customer (own) or staff cancel. Customers are limited by the 2-hour cutoff. */
export async function cancel(req, res) {
  const appt = assertAccess(req, await Appointment.findByPk(req.params.id));
  if (isCustomer(req) && +appt.start - Date.now() < CUSTOMER_CHANGE_CUTOFF_MS) throw ApiError.conflict('Appointments can only be cancelled up to 2 hours before the start time.');
  await setStatus(req, appt, 'cancelled', req.body?.reason);
  ok(res, await load(appt.id));
}

