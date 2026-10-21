import { ApiError } from '../utils/ApiError.js';

/** router.param handler: ids must be plain positive integers. MySQL would otherwise cast "6abc" to 6. */
export function validId(_req, _res, next, value) {
  if (!/^[1-9]\d{0,9}$/.test(String(value))) throw ApiError.notFound();
  next();
}
