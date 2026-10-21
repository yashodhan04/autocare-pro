import { Router } from 'express';
import { validId } from '../middleware/validId.js';
import * as c from '../controllers/estimate.controller.js';
import { authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ADVISORS, ROLES } from '../config/constants.js';
import * as s from '../validation/schemas.js';

const r = Router();
for (const p of ['id', 'taskId', 'reqId']) r.param(p, validId);
r.get('/', authorize(ADVISORS, ROLES.MECHANIC, ROLES.CASHIER, ROLES.CUSTOMER), c.listEstimates);
r.post('/', authorize(ADVISORS), validate(s.estimateSchema.required({ job: true })), c.createEstimate);
r.get('/:id', authorize(ADVISORS, ROLES.MECHANIC, ROLES.CASHIER, ROLES.CUSTOMER), c.getEstimate);
r.put('/:id', authorize(ADVISORS), validate(s.estimateSchema), c.updateEstimate);
r.delete('/:id', authorize(ADVISORS), c.discardEstimate);
r.post('/:id/submit', authorize(ADVISORS), c.submitEstimate);
r.post('/:id/decision', authorize(ADVISORS, ROLES.CUSTOMER), validate(s.decisionSchema), c.decide);
export default r;
