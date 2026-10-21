import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

/** DECIMAL columns come back from mysql2 as strings — expose them as numbers. */
export const money = (name, precision = 12, scale = 2, extra = {}) => ({
  type: DataTypes.DECIMAL(precision, scale),
  allowNull: false,
  defaultValue: 0,
  get() { const v = this.getDataValue(name); return v == null ? v : Number(v); },
  ...extra,
});

/** Legacy-compatible ids for the API (the client was built on `_id`): every object that has `id` also gets `_id` (string). Keeps the client contract stable. */
function idify(v) {
  if (Array.isArray(v)) return v.map(idify);
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    const o = {};
    for (const k of Object.keys(v)) o[k] = idify(v[k]);
    if (o.id != null && o._id == null) { o._id = String(o.id); }
    return o;
  }
  return v;
}

export class Base extends Model {
  toJSON() { return idify(this.get({ plain: true })); }
}

/** define('Name', attrs, opts) — all models share the same base, naming and timestamp defaults. */
export function define(name, attributes, options = {}) {
  class M extends Base {}
  M.init(attributes, { sequelize, modelName: name, tableName: options.tableName ?? name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase() + 's', ...options });
  return M;
}

export { DataTypes };
