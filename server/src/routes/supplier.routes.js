import { Router } from 'express';
import { validId } from '../middleware/validId.js';
import * as c from '../controllers/supplier.controller.js';
import { authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { STOCK_ROLES } from '../config/constants.js';
import * as s from '../validation/schemas.js';

export const suppliers = Router();
for (const p of ['id', 'taskId', 'reqId']) suppliers.param(p, validId);
suppliers.use(authorize(STOCK_ROLES));
suppliers.get('/', c.listSuppliers);
suppliers.post('/', validate(s.supplierSchema), c.createSupplier);
suppliers.get('/:id', c.getSupplier);
suppliers.patch('/:id', validate(s.supplierSchema.partial()), c.updateSupplier);

export const purchaseOrders = Router();
for (const p of ['id', 'taskId', 'reqId']) purchaseOrders.param(p, validId);
purchaseOrders.use(authorize(STOCK_ROLES));
purchaseOrders.get('/', c.listPOs);
purchaseOrders.post('/', validate(s.purchaseOrderSchema), c.createPO);
purchaseOrders.get('/:id', c.getPO);
purchaseOrders.post('/:id/receive', validate(s.receiveSchema), c.receivePO);
purchaseOrders.post('/:id/order', (req, _res, next) => { req.params.action = 'order'; next(); }, c.poAction);
purchaseOrders.post('/:id/cancel', (req, _res, next) => { req.params.action = 'cancel'; next(); }, c.poAction);
