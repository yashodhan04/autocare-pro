import { Op } from 'sequelize';
import { Supplier, InventoryItem, PurchaseOrder, PurchaseOrderLine } from '../models/index.js';
import { sequelize } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, searchFilter, and, ok, created, list } from '../utils/pagination.js';
import { round2 } from '../utils/money.js';
import { nextNumber } from '../utils/sequence.js';
import { audit } from '../services/audit.service.js';
import { applyMovement } from '../services/inventory.service.js';
import { found, cleanBool } from './helpers.js';

export async function listSuppliers(req, res) {
  const where = {};
  const active = cleanBool(req.query.active);
  if (active !== undefined) where.isActive = active;
  list(res, await paginate(Supplier, req, { where: and(where, searchFilter(req.query.q, ['name', 'contactPerson', 'email', 'phone'])), order: [['name', 'ASC']] }));
}

export async function createSupplier(req, res) {
  const s = await Supplier.create(req.body);
  await audit(req, 'supplier.create', { type: 'Supplier', id: s.id }, `Added supplier ${s.name}`);
  created(res, s);
}

export async function updateSupplier(req, res) {
  const s = found(await Supplier.findByPk(req.params.id), 'Supplier');
  await s.update(req.body);
  await audit(req, 'supplier.update', { type: 'Supplier', id: s.id }, `Updated supplier ${s.name}`);
  ok(res, s);
}

/** Supplier detail: supplied parts + purchase order history + totals. */
export async function getSupplier(req, res) {
  const s = found(await Supplier.findByPk(req.params.id), 'Supplier');
  const [parts, orders] = await Promise.all([
    InventoryItem.findAll({ where: { supplierId: s.id, isActive: true }, attributes: ['id', 'name', 'sku', 'quantity', 'purchasePrice'] }),
    PurchaseOrder.findAll({ where: { supplierId: s.id }, order: [['createdAt', 'DESC']], limit: 50, attributes: ['id', 'poNo', 'status', 'total', 'createdAt'] }),
  ]);
  const spend = orders.filter((o) => !['cancelled', 'draft'].includes(o.status)).reduce((a, o) => a + o.total, 0);
  ok(res, { ...s.toJSON(), parts, orders, totalSpend: round2(spend) });
}

// ── Purchase orders ──────────────────────────────────────────
const PO_POP = [
  { association: 'supplier', attributes: ['id', 'name'] },
  { association: 'createdBy', attributes: ['id', 'name'] },
  { association: 'lines', include: [{ association: 'item', attributes: ['id', 'name', 'sku'] }] },
];
const loadPO = (id) => PurchaseOrder.findByPk(id, { include: PO_POP, order: [[{ model: PurchaseOrderLine, as: 'lines' }, 'id', 'ASC']] });

export async function listPOs(req, res) {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.supplier) where.supplierId = req.query.supplier;
  list(res, await paginate(PurchaseOrder, req, { where: and(where, searchFilter(req.query.q, ['poNo'])), include: PO_POP }));
}

export async function getPO(req, res) {
  ok(res, found(await loadPO(req.params.id), 'Purchase order'));
}

export async function createPO(req, res) {
  const supplier = found(await Supplier.findOne({ where: { id: req.body.supplier, isActive: true } }), 'Supplier');
  const ids = req.body.lines.map((l) => l.item);
  if (new Set(ids).size !== ids.length) throw ApiError.badRequest('Each part can appear only once per order');
  if ((await InventoryItem.count({ where: { id: { [Op.in]: ids } } })) !== ids.length) throw ApiError.badRequest('One or more parts do not exist');
  const total = round2(req.body.lines.reduce((s, l) => s + l.quantity * l.unitCost, 0));
  const poNo = await nextNumber('PO', 'PO');
  const po = await sequelize.transaction(async (transaction) => {
    const p = await PurchaseOrder.create({ supplierId: supplier.id, expectedDate: req.body.expectedDate, notes: req.body.notes, total, poNo, createdById: req.user.id }, { transaction });
    await PurchaseOrderLine.bulkCreate(req.body.lines.map((l) => ({ purchaseOrderId: p.id, itemId: l.item, quantity: l.quantity, unitCost: l.unitCost })), { transaction });
    return p;
  });
  await audit(req, 'po.create', { type: 'PurchaseOrder', id: po.id }, `${po.poNo} created for ${supplier.name}`, { total });
  created(res, await loadPO(po.id));
}

export async function poAction(req, res) {
  const po = found(await PurchaseOrder.findByPk(req.params.id), 'Purchase order');
  const action = req.params.action;
  const allowed = { order: ['draft'], cancel: ['draft', 'ordered'] };
  if (!allowed[action]?.includes(po.status)) throw ApiError.conflict(`Cannot ${action} a ${po.status} purchase order`);
  await po.update({ status: action === 'order' ? 'ordered' : 'cancelled' });
  await audit(req, `po.${action}`, { type: 'PurchaseOrder', id: po.id }, `${po.poNo} ${po.status}`);
  ok(res, await loadPO(po.id));
}

/** Receive goods: validated against ordered quantities; all stock-ins + the PO update commit atomically. */
export async function receivePO(req, res) {
  const poId = Number(req.params.id);
  await sequelize.transaction(async (transaction) => {
    const po = found(await PurchaseOrder.findByPk(poId, { transaction, lock: transaction.LOCK.UPDATE }), 'Purchase order');
    if (!['ordered', 'partially_received'].includes(po.status)) throw ApiError.conflict(`Cannot receive a ${po.status} purchase order`);
    const lines = await PurchaseOrderLine.findAll({ where: { purchaseOrderId: po.id }, transaction, lock: transaction.LOCK.UPDATE });

    const received = new Map();
    for (const l of req.body.lines) {
      const line = lines.find((x) => x.itemId === l.item);
      if (!line) throw ApiError.badRequest('Received item is not on this purchase order');
      const prev = received.get(l.item) ?? 0;
      if (line.receivedQuantity + prev + l.quantity > line.quantity) throw ApiError.badRequest(`Cannot receive more than ordered (${line.quantity - line.receivedQuantity} outstanding)`);
      received.set(l.item, prev + l.quantity);
    }
    for (const [itemId, qty] of received) {
      await applyMovement({ itemId, type: 'in', quantity: qty, reason: 'purchase', by: req.user.id, note: `Received on ${po.poNo}`, reference: { kind: 'PurchaseOrder', id: po.id }, transaction });
      const line = lines.find((x) => x.itemId === itemId);
      line.receivedQuantity += qty;
      await line.save({ transaction });
    }
    po.receipts = [...(po.receipts ?? []), { at: new Date(), by: req.user.id, lines: [...received].map(([item, quantity]) => ({ item, quantity })) }];
    po.status = lines.every((l) => l.receivedQuantity >= l.quantity) ? 'received' : 'partially_received';
    await po.save({ transaction });
    await audit(req, 'po.receive', { type: 'PurchaseOrder', id: po.id }, `${po.poNo} → ${po.status}`);
  });
  ok(res, await loadPO(poId));
}
