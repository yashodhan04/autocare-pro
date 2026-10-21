import { Op } from 'sequelize';
import { Notification, User, Customer } from '../models/index.js';
import { emitToUser } from '../socket.js';

/** Create in-app notifications for specific users and push them over Socket.IO. */
export async function notifyUsers(userIds, { type, title, message, link }) {
  const ids = [...new Set(userIds.filter(Boolean).map(Number))];
  if (!ids.length) return [];
  const docs = await Notification.bulkCreate(ids.map((userId) => ({ userId, type, title, message: message?.slice(0, 500), link })));
  docs.forEach((d) => emitToUser(d.userId, 'notification', d.toJSON()));
  return docs;
}

/** Notify everyone holding one of the given roles. */
export async function notifyRoles(roles, payload) {
  const users = await User.findAll({ where: { role: { [Op.in]: roles }, isActive: true }, attributes: ['id'] });
  return notifyUsers(users.map((u) => u.id), payload);
}

/** Notify a customer (only if the customer has a login account). */
export async function notifyCustomer(customerId, payload) {
  const c = await Customer.findByPk(customerId, { attributes: ['userId'] });
  return c?.userId ? notifyUsers([c.userId], payload) : [];
}

// Fire-and-forget wrapper: notification failures must never fail the business call.
export const safe = (p) => p.catch((e) => console.error('[notify] failed', e.message));
