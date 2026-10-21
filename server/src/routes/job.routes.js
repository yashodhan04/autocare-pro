import { Router } from 'express';
import { validId } from '../middleware/validId.js';
import * as c from '../controllers/job.controller.js';
import { authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ADVISORS, ALL_ROLES, ROLES, STOCK_ROLES } from '../config/constants.js';
import * as s from '../validation/schemas.js';
import { z } from 'zod';

const r = Router();
for (const p of ['id', 'taskId', 'reqId']) r.param(p, validId);
const crew = authorize(ADVISORS, ROLES.MECHANIC);
const resolveSchema = z.object({ action: z.enum(['issue', 'reject']), note: z.string().trim().max(300).optional() });

r.get('/', authorize(ALL_ROLES), c.listJobs);
r.post('/', authorize(ADVISORS), validate(s.jobCreateSchema), c.createJob);
r.get('/:id', authorize(ALL_ROLES), c.getJob);
r.patch('/:id', authorize(ADVISORS), validate(s.jobUpdateSchema), c.updateJob);
r.post('/:id/transition', authorize(ADVISORS, ROLES.MECHANIC, ROLES.CASHIER), validate(s.transitionSchema), c.transition);
r.post('/:id/quality-check', authorize(ADVISORS), validate(s.qualityCheckSchema), c.qualityCheck);

r.post('/:id/tasks', crew, validate(s.taskSchema), c.addTask);
r.patch('/:id/tasks/:taskId', crew, validate(s.taskDoneSchema), c.setTaskDone);
r.post('/:id/time-logs', crew, validate(s.timeLogSchema), c.addTimeLog);
r.post('/:id/notes', crew, validate(s.noteSchema), c.addNote);
r.post('/:id/part-requests', crew, validate(s.partRequestSchema), c.requestPart);
r.patch('/:id/part-requests/:reqId', authorize(STOCK_ROLES), validate(resolveSchema), c.resolvePart);
export default r;
