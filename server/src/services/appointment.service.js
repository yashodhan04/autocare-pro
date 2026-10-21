import { Op } from 'sequelize';
import { Appointment, Vehicle } from '../models/index.js';
import { BLOCKING_APPT_STATUS } from '../config/constants.js';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const { openHour, closeHour, bays, slotMinutes, closedWeekdays } = config.workshop;
const MIN = 60_000;

/** Workshop rules: future, slot-aligned, open weekday, inside opening hours. Times are server-local. */
export function assertWithinHours(start, end) {
  if (Number.isNaN(start.getTime())) throw ApiError.badRequest('Invalid appointment time');
  if (start.getTime() < Date.now()) throw ApiError.badRequest('Appointments cannot be booked in the past');
  if (closedWeekdays.includes(start.getDay())) throw ApiError.badRequest('The workshop is closed on this day');
  if (start.getMinutes() % slotMinutes !== 0 || start.getSeconds() !== 0) throw ApiError.badRequest(`Appointments start on ${slotMinutes}-minute slots`);
  const opens = new Date(start); opens.setHours(openHour, 0, 0, 0);
  const closes = new Date(start); closes.setHours(closeHour, 0, 0, 0);
  if (start < opens || end > closes) throw ApiError.badRequest(`Appointments must fall within opening hours (${openHour}:00–${closeHour}:00) and finish by closing time`);
}

/** Blocking appointments overlapping [start, end). */
const overlapping = (start, end, excludeId) =>
  Appointment.findAll({
    where: { status: { [Op.in]: BLOCKING_APPT_STATUS }, start: { [Op.lt]: end }, end: { [Op.gt]: start }, ...(excludeId && { id: { [Op.ne]: excludeId } }) },
    attributes: ['id', 'start', 'end', 'vehicleId'],
  });

/** True if at any 30-minute step inside [start,end) all bays are already taken. */
function baysExceeded(appts, start, end, limit = bays) {
  for (let t = +start; t < +end; t += slotMinutes * MIN) {
    if (appts.filter((a) => +a.start <= t && +a.end > t).length >= limit) return true;
  }
  return false;
}

/** Full validation used by create and reschedule. */
export async function assertSlotAvailable({ start, service, vehicleId, excludeId }) {
  const end = new Date(+start + service.estimatedDurationMinutes * MIN);
  assertWithinHours(start, end);
  const vehicle = await Vehicle.findByPk(vehicleId);
  if (!vehicle || !vehicle.isActive) throw ApiError.badRequest('Vehicle not found');
  if (!service.isActive) throw ApiError.badRequest('This service is not currently offered');
  if (!service.vehicleTypes.includes(vehicle.vehicleType)) throw ApiError.badRequest(`${service.name} is not available for ${vehicle.vehicleType} vehicles`);

  const appts = await overlapping(start, end, excludeId);
  if (appts.some((a) => a.vehicleId === Number(vehicleId))) throw ApiError.conflict('This vehicle already has a booking that overlaps this time');
  if (baysExceeded(appts, start, end)) throw ApiError.conflict('That time is fully booked. Please choose another slot.');
  return { end, vehicle };
}

/** Post-insert re-check closes the race between two simultaneous bookings (both fail safe). */
export async function recheckAfterInsert(appt) {
  const appts = await overlapping(appt.start, appt.end, appt.id);
  return !baysExceeded([...appts, appt], appt.start, appt.end, bays + 1);
}

/** Slot grid for a given day and service duration. */
export async function daySlots(dateStr, service) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const day = new Date(y, m - 1, d);
  if (Number.isNaN(day.getTime())) throw ApiError.badRequest('date must be YYYY-MM-DD');
  if (closedWeekdays.includes(day.getDay())) return { open: false, slots: [] };

  const dayStart = new Date(day); dayStart.setHours(openHour, 0, 0, 0);
  const dayEnd = new Date(day); dayEnd.setHours(closeHour, 0, 0, 0);
  const appts = await overlapping(dayStart, dayEnd);
  const slots = [];
  for (let t = +dayStart; t + service.estimatedDurationMinutes * MIN <= +dayEnd; t += slotMinutes * MIN) {
    const start = new Date(t);
    const end = new Date(t + service.estimatedDurationMinutes * MIN);
    slots.push({ start, available: start.getTime() > Date.now() && !baysExceeded(appts, start, end) });
  }
  return { open: true, slots };
}
