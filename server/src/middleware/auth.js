import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { ROLES } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { User, Customer } from '../models/index.js';

export const COOKIE_NAME = 'autocare_session';
const cookieOpts = () => ({ httpOnly: true, sameSite: config.isProduction ? 'none' : 'lax', secure: config.isProduction, maxAge: 7 * 24 * 3600 * 1000, path: '/' });

/** Sets the httpOnly session cookie (not readable by page JavaScript, so XSS cannot steal it). */
export const setSessionCookie = (res, token) => res.cookie(COOKIE_NAME, token, cookieOpts());
export const clearSessionCookie = (res) => res.clearCookie(COOKIE_NAME, { ...cookieOpts(), maxAge: undefined });

export const signToken = (user) => jwt.sign({ sub: String(user.id), role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

/** Verifies the Bearer token, loads the user and (for customers) their customer profile id. */
export async function authenticate(req, _res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.[COOKIE_NAME];
  if (!token) throw ApiError.unauthorized();

  const payload = jwt.verify(token, config.jwtSecret);
  if (!/^[1-9]\d{0,9}$/.test(String(payload.sub))) throw ApiError.unauthorized('Invalid session');
  const user = await User.findByPk(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('Account not found or deactivated');

  req.user = user;
  if (user.role === ROLES.CUSTOMER) {
    const customer = await Customer.findOne({ where: { userId: user.id }, attributes: ['id'] });
    req.customerId = customer?.id;
  }
  next();
}

/** Role gate: authorize(ADMINS, ROLES.CASHIER) — accepts roles or arrays of roles. */
export const authorize = (...roles) => {
  const allowed = new Set(roles.flat());
  return (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!allowed.has(req.user.role)) throw ApiError.forbidden();
    next();
  };
};

export const isCustomer = (req) => req.user?.role === ROLES.CUSTOMER;

/** Customers are confined to their own records; staff see everything. */
// -1 never matches a real row (a bare NULL would match unlinked records)
export const ownerFilter = (req, field = 'customerId') => (isCustomer(req) ? { [field]: req.customerId ?? -1 } : {});
