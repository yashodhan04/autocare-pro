import { Op } from 'sequelize';
import { Customer, Vehicle, ServiceJob, Invoice, Appointment } from '../models/index.js';
import { paginate, searchFilter, and, ok, created, list } from '../utils/pagination.js';
import { audit } from '../services/audit.service.js';
import { found, cleanBool } from './helpers.js';
import { ApiError } from '../utils/ApiError.js';

const OPEN = { [Op.notIn]: ['delivered', 'cancelled'] };

export async function listCustomers(req, res) {
  const where = {};
  const active = cleanBool(req.query.active);
  if (active !== undefined) where.isActive = active;
  list(res, await paginate(Customer, req, { where: and(where, searchFilter(req.query.q, ['name', 'email', 'phone'])), order: [['name', 'ASC']] }));
}

export async function createCustomer(req, res) {
  const c = await Customer.create(req.body);
  await audit(req, 'customer.create', { type: 'Customer', id: c.id }, `Created customer ${c.name}`);
  created(res, c);
}

export async function getCustomer(req, res) {
  const c = found(await Customer.findByPk(req.params.id), 'Customer');
  const [vehicles, totalJobs, openJobs] = await Promise.all([
    Vehicle.findAll({ where: { customerId: c.id, isActive: true }, order: [['make', 'ASC']] }),
    ServiceJob.count({ where: { customerId: c.id } }),
    ServiceJob.count({ where: { customerId: c.id, status: OPEN } }),
  ]);
  ok(res, { ...c.toJSON(), vehicles, stats: { totalJobs, openJobs } });
}

export async function updateCustomer(req, res) {
  const c = found(await Customer.findByPk(req.params.id), 'Customer');
  await c.update(req.body);
  await audit(req, 'customer.update', { type: 'Customer', id: c.id }, `Updated customer ${c.name}`, req.body);
  ok(res, c);
}

/** Soft delete: customers with history are deactivated, never removed. */
export async function deactivateCustomer(req, res) {
  const c = found(await Customer.findByPk(req.params.id), 'Customer');
  const open = await ServiceJob.count({ where: { customerId: c.id, status: OPEN } });
  if (open) throw ApiError.conflict(`Customer has ${open} open service job(s) and cannot be deactivated`);
  await c.update({ isActive: false });
  await audit(req, 'customer.deactivate', { type: 'Customer', id: c.id }, `Deactivated customer ${c.name}`);
  ok(res, c);
}

export async function customerHistory(req, res) {
  const c = found(await Customer.findByPk(req.params.id), 'Customer');
  const [jobs, invoices, appointments] = await Promise.all([
    ServiceJob.findAll({ where: { customerId: c.id }, include: [{ association: 'vehicle', attributes: ['id', 'registrationNumber', 'make', 'model'] }], order: [['checkInAt', 'DESC']], limit: 50 }),
    Invoice.findAll({ where: { customerId: c.id }, order: [['issuedAt', 'DESC']], limit: 50 }),
    Appointment.findAll({ where: { customerId: c.id }, include: [{ association: 'service', attributes: ['id', 'name'] }, { association: 'vehicle', attributes: ['id', 'registrationNumber'] }], order: [['start', 'DESC']], limit: 20 }),
  ]);
  ok(res, { jobs, invoices, appointments });
}
