import { Counter } from '../models/index.js';
import { sequelize } from '../config/db.js';

/**
 * Gap-tolerant sequential numbers, e.g. nextNumber('JOB','JC') -> "JC-000042".
 * Row-locked inside its own short transaction, so concurrent callers never get the same number.
 */
export async function nextNumber(key, prefix) {
  const seq = await sequelize.transaction(async (transaction) => {
    await Counter.findOrCreate({ where: { name: key }, defaults: { seq: 0 }, transaction });
    const c = await Counter.findByPk(key, { transaction, lock: transaction.LOCK.UPDATE });
    c.seq += 1;
    await c.save({ transaction });
    return c.seq;
  });
  return `${prefix}-${String(seq).padStart(6, '0')}`;
}
