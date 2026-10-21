import { Router } from 'express';
import { validId } from '../middleware/validId.js';
import * as c from '../controllers/service.controller.js';
import { authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ADMINS } from '../config/constants.js';
import { serviceSchema } from '../validation/schemas.js';

const r = Router();
for (const p of ['id', 'taskId', 'reqId']) r.param(p, validId);
r.get('/', c.listServices);
r.post('/', authorize(ADMINS), validate(serviceSchema), c.createService);
r.patch('/:id', authorize(ADMINS), validate(serviceSchema.partial()), c.updateService);
r.delete('/:id', authorize(ADMINS), c.deleteService);
export default r;
