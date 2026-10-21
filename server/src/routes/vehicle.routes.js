import { Router } from 'express';
import { validId } from '../middleware/validId.js';
import * as c from '../controllers/vehicle.controller.js';
import { authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ADVISORS, ALL_ROLES, ROLES } from '../config/constants.js';
import { vehicleSchema } from '../validation/schemas.js';

const r = Router();
for (const p of ['id', 'taskId', 'reqId']) r.param(p, validId);
const write = authorize(ADVISORS, ROLES.CUSTOMER);
r.get('/', authorize(ALL_ROLES), c.listVehicles);
r.post('/', write, validate(vehicleSchema), c.createVehicle);
r.get('/:id', authorize(ALL_ROLES), c.getVehicle);
r.get('/:id/history', authorize(ALL_ROLES), c.vehicleHistory);
r.patch('/:id', write, validate(vehicleSchema.partial()), c.updateVehicle);
r.delete('/:id', write, c.deactivateVehicle);
export default r;
