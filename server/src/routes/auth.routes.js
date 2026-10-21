import { Router } from 'express';
import { validId } from '../middleware/validId.js';
import * as c from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import * as s from '../validation/schemas.js';

const r = Router();
for (const p of ['id', 'taskId', 'reqId']) r.param(p, validId);
r.post('/register', authLimiter, validate(s.registerSchema), c.register);
r.post('/login', authLimiter, validate(s.loginSchema), c.login);
r.post('/forgot-password', authLimiter, validate(s.forgotSchema), c.forgotPassword);
r.post('/reset-password', authLimiter, validate(s.resetSchema), c.resetPassword);
r.post('/logout', authenticate, c.logout);
r.get('/me', authenticate, c.me);
r.patch('/me', authenticate, validate(s.profileSchema), c.updateMe);
r.post('/change-password', authenticate, validate(s.changePasswordSchema), c.changePassword);
export default r;
