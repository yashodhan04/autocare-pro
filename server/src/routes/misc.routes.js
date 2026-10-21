import { Router } from 'express';
import { validId } from '../middleware/validId.js';
import * as c from '../controllers/misc.controller.js';
import * as rep from '../controllers/report.controller.js';
import { authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ADMINS, ADVISORS, ALL_ROLES, ROLES, STOCK_ROLES } from '../config/constants.js';
import * as s from '../validation/schemas.js';

export const notifications = Router();
for (const p of ['id', 'taskId', 'reqId']) notifications.param(p, validId);
notifications.get('/', c.listNotifications);
notifications.post('/read-all', c.markAllRead);
notifications.patch('/:id/read', c.markRead);

export const plans = Router();
for (const p of ['id', 'taskId', 'reqId']) plans.param(p, validId);
plans.get('/', authorize(ADVISORS, ROLES.CUSTOMER), c.listPlans);
plans.get('/due', authorize(ADVISORS, ROLES.CUSTOMER), c.duePlans);
plans.post('/', authorize(ADVISORS), validate(s.planSchema), c.createPlan);
plans.patch('/:id', authorize(ADVISORS), validate(s.planSchema.innerType().partial()), c.updatePlan);
plans.delete('/:id', authorize(ADVISORS), c.deletePlan);

export const reviews = Router();
for (const p of ['id', 'taskId', 'reqId']) reviews.param(p, validId);
reviews.get('/', authorize(ALL_ROLES), c.listReviews);
reviews.get('/reviewable', authorize(ROLES.CUSTOMER), c.reviewable);
reviews.post('/', authorize(ROLES.CUSTOMER), validate(s.reviewSchema), c.createReview);
reviews.patch('/:id/moderate', authorize(ADMINS), validate(s.moderationSchema), c.moderateReview);

export const audit = Router();
for (const p of ['id', 'taskId', 'reqId']) audit.param(p, validId);
audit.get('/', authorize(ADMINS), c.listAudit);

export const reports = Router();
for (const p of ['id', 'taskId', 'reqId']) reports.param(p, validId);
reports.get('/dashboard', rep.dashboard);
reports.get('/revenue', authorize(ADMINS, ROLES.CASHIER), rep.revenue);
reports.get('/services', authorize(ADVISORS), rep.services);
reports.get('/pending-jobs', authorize(ADVISORS), rep.pendingJobs);
reports.get('/appointments', authorize(ADVISORS), rep.appointmentTrends);
reports.get('/inventory-movement', authorize(STOCK_ROLES), rep.inventoryMovement);
reports.get('/low-stock', authorize(STOCK_ROLES, ROLES.SERVICE_ADVISOR), rep.lowStock);
reports.get('/mechanic-workload', authorize(ADMINS), rep.mechanicWorkload);
reports.get('/customer-activity', authorize(ADMINS), rep.customerActivity);
