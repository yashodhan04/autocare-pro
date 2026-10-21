import { Op, literal } from 'sequelize';
import { InventoryItem, InventoryMovement } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, searchFilter, and, ok, created, list } from '../utils/pagination.js';
import { audit } from '../services/audit.service.js';
import { applyMovement } from '../services/inventory.service.js';
import { found, cleanBool, toFk } from './helpers.js';

const POP = [{ association: 'supplier', attributes: ['id', 'name'] }];
const LOW = literal('`InventoryItem`.`quantity` <= `InventoryItem`.`reorderLevel`');
const IN_STOCK = literal('`InventoryItem`.`quantity` > `InventoryItem`.`reorderLevel`');

function stockFilter(status) {
  if (status === 'out_of_stock') return { quantity: 0 };
  if (status === 'low_stock') return and({ quantity: { [Op.gt]: 0 } }, LOW);
  if (status === 'in_stock') return IN_STOCK;
  if (status === 'alert') return LOW;
  return null;
}

export async function listItems(req, res) {
  const where = { isActive: cleanBool(req.query.active) ?? true };
  if (req.query.category) where.category = req.query.category;
  if (req.query.supplier) where.supplierId = req.query.supplier;
  list(res, await paginate(InventoryItem, req, { where: and(where, stockFilter(req.query.status), searchFilter(req.query.q, ['name', 'sku', 'location'])), include: POP, order: [['name', 'ASC']] }));
}

export async function alerts(_req, res) {
  ok(res, await InventoryItem.findAll({ where: and({ isActive: true }, LOW), include: POP, order: [['quantity', 'ASC']], limit: 100 }));
}

export async function createItem(req, res) {
  const { quantity = 0, ...data } = toFk(req.body, ['supplier']);
  const item = await InventoryItem.create({ ...data, quantity: 0 });
  if (quantity > 0) await applyMovement({ itemId: item.id, type: 'in', quantity, reason: 'opening', by: req.user.id, note: 'Opening stock' });
  await audit(req, 'inventory.create', { type: 'InventoryItem', id: item.id }, `Added part ${item.sku}`);
  created(res, await InventoryItem.findByPk(item.id, { include: POP }));
}

export async function getItem(req, res) {
  ok(res, found(await InventoryItem.findByPk(req.params.id, { include: POP }), 'Item'));
}

export async function updateItem(req, res) {
  const { quantity: _q, ...data } = toFk(req.body, ['supplier']); // stock only changes via movements
  const item = found(await InventoryItem.findByPk(req.params.id), 'Item');
  await item.update(data);
  await audit(req, 'inventory.update', { type: 'InventoryItem', id: item.id }, `Updated part ${item.sku}`, data);
  ok(res, await InventoryItem.findByPk(item.id, { include: POP }));
}

export async function addMovement(req, res) {
  const { type, quantity, reason, note } = req.body;
  if (type === 'adjust' && !note) throw ApiError.badRequest('A note is required for stock adjustments');
  const r = await applyMovement({ itemId: req.params.id, type, quantity, reason, note, by: req.user.id });
  await audit(req, `inventory.${type}`, { type: 'InventoryItem', id: r.item.id }, `${r.item.sku}: ${r.movement.delta >= 0 ? '+' : ''}${r.movement.delta} (${reason}) → ${r.item.quantity}`, { note });
  created(res, { item: r.item, movement: r.movement });
}

export async function listMovements(req, res) {
  const where = {};
  if (req.query.item) where.itemId = req.query.item;
  if (req.query.type) where.type = req.query.type;
  if (req.query.from || req.query.to) {
    where.createdAt = {};
    if (req.query.from) where.createdAt[Op.gte] = new Date(req.query.from);
    if (req.query.to) where.createdAt[Op.lte] = new Date(req.query.to);
  }
  list(res, await paginate(InventoryMovement, req, { where, include: [{ association: 'item', attributes: ['id', 'name', 'sku'] }, { association: 'by', attributes: ['id', 'name'] }], order: [['createdAt', 'DESC'], ['id', 'DESC']] }));
}

