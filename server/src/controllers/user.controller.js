
import { User } from '../models/index.js';
import { ROLES, STAFF_ROLES } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword } from '../utils/password.js';
import { paginate, searchFilter, and, ok, created, list } from '../utils/pagination.js';
import { audit } from '../services/audit.service.js';
import { found } from './helpers.js';

const PRIVILEGED = [ROLES.SUPER_ADMIN, ROLES.WORKSHOP_ADMIN];

/** Only a super admin may grant, change or remove privileged roles. */
function assertCanManage(req, targetRole, newRole) {
  if (req.user.role === ROLES.SUPER_ADMIN) return;
  if (PRIVILEGED.includes(targetRole) || (newRole && PRIVILEGED.includes(newRole))) throw ApiError.forbidden('Only a super admin can manage admin accounts');
}

export async function listUsers(req, res) {
  const where = {};
  if (req.query.role) where.role = req.query.role;
  if (req.query.active) where.isActive = req.query.active === 'true';
  list(res, await paginate(User, req, { where: and(where, searchFilter(req.query.q, ['name', 'email', 'phone'])), order: [['name', 'ASC']] }));
}

/** Lightweight staff directory (e.g. mechanics for job assignment) available to all staff. */
export async function staffDirectory(req, res) {
  const role = STAFF_ROLES.includes(req.query.role) ? req.query.role : ROLES.MECHANIC;
  ok(res, await User.findAll({ where: { role, isActive: true }, attributes: ['id', 'name', 'role'], order: [['name', 'ASC']] }));
}

export async function createUser(req, res) {
  assertCanManage(req, null, req.body.role);
  if (await User.count({ where: { email: req.body.email } })) throw ApiError.conflict('An account with this email already exists');
  const { password, ...rest } = req.body;
  const user = await User.create({ ...rest, passwordHash: await hashPassword(password) });
  await audit(req, 'user.create', { type: 'User', id: user.id }, `Created ${user.role} account for ${user.name}`);
  created(res, user);
}

export async function updateUser(req, res) {
  const user = found(await User.findByPk(req.params.id), 'User');
  assertCanManage(req, user.role, req.body.role);
  if (user.id === req.user.id && (req.body.isActive === false || (req.body.role && req.body.role !== user.role))) {
    throw ApiError.badRequest('You cannot deactivate or change the role of your own account');
  }
  const before = { role: user.role, isActive: user.isActive };
  Object.assign(user, req.body);
  await user.save();
  if (before.role !== user.role) await audit(req, 'user.role_change', { type: 'User', id: user.id }, `${user.name}: ${before.role} -> ${user.role}`);
  else await audit(req, 'user.update', { type: 'User', id: user.id }, `Updated ${user.name}`, req.body);
  ok(res, user);
}

