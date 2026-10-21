import { Router } from 'express';
import { validId } from '../middleware/validId.js';
import * as c from '../controllers/user.controller.js';
import { authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ADMINS, STAFF_ROLES } from '../config/constants.js';
import * as s from '../validation/schemas.js';

const r = Router();
for (const p of ['id', 'taskId', 'reqId']) r.param(p, validId);
r.get('/staff', authorize(STAFF_ROLES), c.staffDirectory);
r.get('/', authorize(ADMINS), c.listUsers);
r.post('/', authorize(ADMINS), validate(s.createUserSchema), c.createUser);
r.patch('/:id', authorize(ADMINS), validate(s.updateUserSchema), c.updateUser);
export default r;
