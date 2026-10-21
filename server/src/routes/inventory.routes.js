import { Router } from 'express';
import { validId } from '../middleware/validId.js';
import * as c from '../controllers/inventory.controller.js';
import { authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { STAFF_ROLES, STOCK_ROLES } from '../config/constants.js';
import * as s from '../validation/schemas.js';

const r = Router();
for (const p of ['id', 'taskId', 'reqId']) r.param(p, validId);
r.get('/', authorize(STAFF_ROLES), c.listItems);
r.get('/alerts', authorize(STAFF_ROLES), c.alerts);
r.get('/movements', authorize(STOCK_ROLES), c.listMovements);
r.post('/', authorize(STOCK_ROLES), validate(s.inventoryItemSchema), c.createItem);
r.get('/:id', authorize(STAFF_ROLES), c.getItem);
r.patch('/:id', authorize(STOCK_ROLES), validate(s.inventoryItemSchema.partial()), c.updateItem);
r.post('/:id/movements', authorize(STOCK_ROLES), validate(s.movementSchema), c.addMovement);
export default r;
