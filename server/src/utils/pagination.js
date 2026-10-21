import { Op } from 'sequelize';

/** Escape LIKE wildcards in user input. */
export const escapeLike = (s) => String(s).replace(/[\\%_]/g, '\\$&');

/** Case-insensitive "contains" search over the given columns (MySQL's default collation is case-insensitive). */
export function searchFilter(q, fields) {
  const term = String(q ?? '').trim().slice(0, 80);
  if (!term) return null;
  return { [Op.or]: fields.map((f) => ({ [f]: { [Op.like]: `%${escapeLike(term)}%` } })) };
}

/** Combine where-fragments (each may be an object, null, or hold Op symbols) with AND. */
export const and = (...parts) => ({ [Op.and]: parts.filter(Boolean) });

const DESC = (col = 'createdAt') => [[col, 'DESC']];
export const sortDesc = DESC;

/**
 * Paginated findAndCountAll. Returns { items, pagination }.
 * opts: { where, include, order, attributes, defaultLimit }
 */
export async function paginate(Model, req, { where, include, order = DESC(), attributes, defaultLimit = 10 } = {}) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || defaultLimit, 1), 100);
  const { rows, count } = await Model.findAndCountAll({ where, include, order, attributes, limit, offset: (page - 1) * limit, distinct: true });
  return { items: rows, pagination: { page, limit, total: count, totalPages: Math.max(Math.ceil(count / limit), 1) } };
}

export const ok = (res, data, extra = {}) => res.json({ success: true, data, ...extra });
export const created = (res, data) => res.status(201).json({ success: true, data });
export const list = (res, { items, pagination }) => res.json({ success: true, data: items, pagination });
