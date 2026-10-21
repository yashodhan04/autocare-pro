import { Router } from 'express';
import { validId } from '../middleware/validId.js';
import * as c from '../controllers/appointment.controller.js';
import { authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ADVISORS, ROLES } from '../config/constants.js';
import * as s from '../validation/schemas.js';

const r = Router();
for (const p of ['id', 'taskId', 'reqId']) r.param(p, validId);
const booking = authorize(ADVISORS, ROLES.CUSTOMER);
r.get('/', authorize(ADVISORS, ROLES.CASHIER, ROLES.CUSTOMER), c.listAppointments);
r.get('/availability', booking, c.availability);
r.post('/', booking, validate(s.appointmentSchema), c.createAppointment);
r.patch('/:id/reschedule', booking, validate(s.rescheduleSchema), c.reschedule);
r.patch('/:id/status', authorize(ADVISORS), validate(s.appointmentStatusSchema), c.updateStatus);
r.post('/:id/cancel', booking, c.cancel);
export default r;
