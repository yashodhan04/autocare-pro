import { InventoryItem, InventoryMovement } from '../models/index.js';
import { sequelize } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../config/constants.js';
import { notifyRoles, safe } from './notification.service.js';

const LOW_STOCK_ROLES = [ROLES.INVENTORY_MANAGER, ROLES.WORKSHOP_ADMIN];

/**
 * The ONLY way stock quantity changes. Runs in a transaction that row-locks the item
 * (SELECT … FOR UPDATE), so concurrent movements are serialised: stock can never go
 * negative and every ledger row records the true balance.
 *
 * @param type  'in' | 'out' | 'adjust'
 * @param quantity in/out: positive quantity. adjust: the NEW absolute quantity.
 * @param transaction optional outer transaction to join (e.g. PO receiving)
 */
export async function applyMovement({ itemId, type, quantity, reason = 'other', note, by, reference, transaction }) {
  if (!Number.isFinite(quantity) || quantity < 0) throw ApiError.badRequest('Quantity must be a non-negative number');
  if (type !== 'adjust' && quantity <= 0) throw ApiError.badRequest('Quantity must be greater than zero');

  const run = async (t) => {
    const item = await InventoryItem.findByPk(itemId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!item) throw ApiError.notFound('Inventory item not found');

    let delta;
    if (type === 'in') delta = quantity;
    else if (type === 'out') {
      if (item.quantity < quantity) throw ApiError.conflict(`Insufficient stock for "${item.name}": ${item.quantity} available, ${quantity} requested`);
      delta = -quantity;
    } else {
      delta = quantity - item.quantity;
      reason = reason === 'other' ? 'correction' : reason;
    }
    item.quantity += delta;
    await item.save({ transaction: t });
    const movement = await InventoryMovement.create({
      itemId: item.id, type, delta, balanceAfter: item.quantity, reason, note, byId: by,
      referenceKind: reference?.kind, referenceId: reference?.id,
    }, { transaction: t });
    return { item, movement };
  };

  const result = transaction ? await run(transaction) : await sequelize.transaction(run);
  const { item, movement } = result;
  if (movement.delta < 0 && item.quantity <= item.reorderLevel) {
    safe(notifyRoles(LOW_STOCK_ROLES, {
      type: 'inventory.low_stock',
      title: item.quantity === 0 ? 'Out of stock' : 'Low stock alert',
      message: `${item.name} (${item.sku}) has ${item.quantity} left (reorder level ${item.reorderLevel}).`,
      link: '/app/inventory',
    }));
  }
  return result;
}
