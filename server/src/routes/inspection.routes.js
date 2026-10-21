import { Router } from 'express';
import { validId } from '../middleware/validId.js';
import * as c from '../controllers/inspection.controller.js';
import { authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ADVISORS, ALL_ROLES, ROLES } from '../config/constants.js';
import { inspectionSchema } from '../validation/schemas.js';

const r = Router();
for (const p of ['id', 'taskId', 'reqId']) r.param(p, validId);
const crew = authorize(ADVISORS, ROLES.MECHANIC);
r.get('/checklist', authorize(ALL_ROLES), c.checklistTemplate);
r.get('/', authorize(ADVISORS, ROLES.MECHANIC, ROLES.CUSTOMER), c.listInspections);
r.post('/', crew, validate(inspectionSchema), c.createInspection);
r.get('/:id', authorize(ADVISORS, ROLES.MECHANIC, ROLES.CUSTOMER), c.getInspection);
r.patch('/:id', crew, validate(inspectionSchema.partial()), c.updateInspection);
export default r;
