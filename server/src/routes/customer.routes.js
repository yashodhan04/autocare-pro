import { Router } from 'express';
import { validId } from '../middleware/validId.js';
import * as c from '../controllers/customer.controller.js';
import { authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ADVISORS, ROLES } from '../config/constants.js';
import { customerSchema } from '../validation/schemas.js';

const r = Router();
for (const p of ['id', 'taskId', 'reqId']) r.param(p, validId);
const read = authorize(ADVISORS, ROLES.CASHIER);
r.get('/', read, c.listCustomers);
r.post('/', authorize(ADVISORS), validate(customerSchema), c.createCustomer);
r.get('/:id', read, c.getCustomer);
r.get('/:id/history', read, c.customerHistory);
r.patch('/:id', authorize(ADVISORS), validate(customerSchema.partial()), c.updateCustomer);
r.delete('/:id', authorize(ADVISORS), c.deactivateCustomer);
export default r;
