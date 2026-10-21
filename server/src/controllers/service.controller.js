import { ServiceCatalog } from '../models/index.js';
import { paginate, searchFilter, and, ok, created, list } from '../utils/pagination.js';
import { audit } from '../services/audit.service.js';
import { isCustomer } from '../middleware/auth.js';
import { literal } from 'sequelize';
import { found, cleanBool } from './helpers.js';

export async function listServices(req, res) {
  const where = {};
  const active = isCustomer(req) ? true : cleanBool(req.query.active);
  if (active !== undefined) where.isActive = active;
  if (req.query.category) where.category = req.query.category;
  const parts = [where, searchFilter(req.query.q, ['name', 'description'])];
  // vehicleTypes is a JSON array column
  if (req.query.vehicleType) parts.push(literal(`JSON_CONTAINS(vehicleTypes, JSON_QUOTE(${ServiceCatalog.sequelize.escape(String(req.query.vehicleType))}))`));
  list(res, await paginate(ServiceCatalog, req, { where: and(...parts), order: [['category', 'ASC'], ['name', 'ASC']], defaultLimit: 50 }));
}

export async function createService(req, res) {
  const s = await ServiceCatalog.create(req.body);
  await audit(req, 'service.create', { type: 'ServiceCatalog', id: s.id }, `Created service ${s.name}`);
  created(res, s);
}

export async function updateService(req, res) {
  const s = found(await ServiceCatalog.findByPk(req.params.id), 'Service');
  await s.update(req.body);
  await audit(req, 'service.update', { type: 'ServiceCatalog', id: s.id }, `Updated service ${s.name}`, req.body);
  ok(res, s);
}

export async function deleteService(req, res) {
  const s = found(await ServiceCatalog.findByPk(req.params.id), 'Service');
  await s.update({ isActive: false });
  await audit(req, 'service.deactivate', { type: 'ServiceCatalog', id: s.id }, `Deactivated service ${s.name}`);
  ok(res, s);
}
