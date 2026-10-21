import { User, Customer } from '../models/index.js';
import { sequelize } from '../config/db.js';
import { ROLES } from '../config/constants.js';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword, verifyPassword, randomToken, sha256 } from '../utils/password.js';
import { ok, created } from '../utils/pagination.js';
import { signToken, setSessionCookie, clearSessionCookie } from '../middleware/auth.js';
import { audit } from '../services/audit.service.js';
import { Op } from 'sequelize';

function session(res, user) {
  const token = signToken(user);
  setSessionCookie(res, token);
  return { token, user }; // token in the body is for API clients (Postman); the browser app uses the cookie
}

export async function register(req, res) {
  const { name, email, password, phone } = req.body;
  if (await User.count({ where: { email } })) throw ApiError.conflict('An account with this email already exists');
  const passwordHash = await hashPassword(password);
  const user = await sequelize.transaction(async (transaction) => {
    const u = await User.create({ name, email, phone, role: ROLES.CUSTOMER, passwordHash }, { transaction });
    // Link to a walk-in customer record with the same email, otherwise create a profile.
    const existing = await Customer.findOne({ where: { email, userId: null }, transaction });
    if (existing) await existing.update({ userId: u.id }, { transaction });
    else await Customer.create({ userId: u.id, name, email, phone }, { transaction });
    return u;
  });
  req.user = user;
  await audit(req, 'auth.register', { type: 'User', id: user.id }, `${name} registered`);
  created(res, session(res, user));
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.scope('withSecrets').findOne({ where: { email } });
  // Same message for unknown email / wrong password to avoid account enumeration.
  if (!user || !(await verifyPassword(password, user.passwordHash))) throw ApiError.unauthorized('Incorrect email or password');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');
  user.lastLoginAt = new Date();
  await user.save();
  req.user = user;
  await audit(req, 'auth.login', { type: 'User', id: user.id }, `${user.name} signed in`);
  ok(res, session(res, user));
}

export async function logout(req, res) {
  await audit(req, 'auth.logout', { type: 'User', id: req.user.id }, `${req.user.name} signed out`);
  clearSessionCookie(res);
  ok(res, { loggedOut: true });
}

export async function me(req, res) {
  const customer = req.customerId ? await Customer.findByPk(req.customerId) : null;
  ok(res, { user: req.user, customer });
}

export async function updateMe(req, res) {
  const { name, phone } = req.body;
  if (name) req.user.name = name;
  if (phone) req.user.phone = phone;
  await req.user.save();
  if (req.customerId) await Customer.update({ ...(name && { name }), ...(phone && { phone }) }, { where: { id: req.customerId } });
  ok(res, req.user);
}

export async function changePassword(req, res) {
  const user = await User.scope('withSecrets').findByPk(req.user.id);
  if (!(await verifyPassword(req.body.currentPassword, user.passwordHash))) throw ApiError.badRequest('Current password is incorrect');
  user.passwordHash = await hashPassword(req.body.newPassword);
  await user.save();
  await audit(req, 'auth.password_change', { type: 'User', id: user.id }, 'Password changed');
  ok(res, { changed: true });
}

export async function forgotPassword(req, res) {
  const user = await User.scope('withSecrets').findOne({ where: { email: req.body.email } });
  const body = { message: 'If an account exists for that email, a reset link has been generated.' };
  if (user && user.isActive) {
    const token = randomToken();
    user.resetTokenHash = sha256(token);
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    // No email service in this version: the reset link is logged server-side and, outside production, returned for demos.
    const link = `${config.clientUrl}/reset-password?token=${token}`;
    if (!config.isTest) console.log(`[Password reset] ${user.email}: ${link}`);
    if (!config.isProduction) body.devResetLink = link;
  }
  ok(res, body);
}

export async function resetPassword(req, res) {
  const user = await User.scope('withSecrets').findOne({ where: { resetTokenHash: sha256(req.body.token), resetTokenExpires: { [Op.gt]: new Date() } } });
  if (!user) throw ApiError.badRequest('This reset link is invalid or has expired');
  user.passwordHash = await hashPassword(req.body.password);
  user.resetTokenHash = null;
  user.resetTokenExpires = null;
  await user.save();
  req.user = user;
  await audit(req, 'auth.password_reset', { type: 'User', id: user.id }, 'Password reset via token');
  ok(res, { reset: true });
}
