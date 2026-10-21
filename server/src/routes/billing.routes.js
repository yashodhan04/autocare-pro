import { Router } from 'express';
import { validId } from '../middleware/validId.js';
import * as c from '../controllers/billing.controller.js';
import { authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ADMINS, ADVISORS, ROLES } from '../config/constants.js';
import * as s from '../validation/schemas.js';

const finance = [...ADVISORS, ROLES.CASHIER];

export const invoices = Router();
for (const p of ['id', 'taskId', 'reqId']) invoices.param(p, validId);
invoices.get('/', authorize(finance, ROLES.CUSTOMER), c.listInvoices);
invoices.post('/', authorize(finance), validate(s.invoiceCreateSchema), c.createInvoice);
invoices.get('/:id', authorize(finance, ROLES.CUSTOMER), c.getInvoice);
invoices.post('/:id/void', authorize(ADMINS), c.voidInvoice);

export const payments = Router();
for (const p of ['id', 'taskId', 'reqId']) payments.param(p, validId);
payments.get('/', authorize(finance, ROLES.CUSTOMER), c.listPayments);
payments.post('/', authorize(ADMINS, ROLES.CASHIER), validate(s.paymentSchema), c.recordPayment);
