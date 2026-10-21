import { ApiError } from '../utils/ApiError.js';
import { isCustomer } from '../middleware/auth.js';

/** Throws 404 when missing; 404 (not 403) when a customer asks for someone else's record, so existence isn't revealed. */
export function assertAccess(req, doc, ownerField = 'customerId') {
  if (!doc) throw ApiError.notFound();
  if (isCustomer(req) && (!req.customerId || String(doc[ownerField]) !== String(req.customerId))) throw ApiError.notFound();
  return doc;
}

export const found = (doc, label = 'Resource') => {
  if (!doc) throw ApiError.notFound(`${label} not found`);
  return doc;
};

export const cleanBool = (v) => (v === 'true' ? true : v === 'false' ? false : undefined);

/** Rename API body keys (customer, vehicle…) to their FK columns (customerId, vehicleId…). */
export function toFk(body, keys) {
  const out = { ...body };
  for (const k of keys) if (k in out) { out[`${k}Id`] = out[k] ?? null; delete out[k]; }
  return out;
}
