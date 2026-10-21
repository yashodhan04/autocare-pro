import request from 'supertest';
import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { config } from '../config/env.js';
import { User, Customer } from '../models/index.js';
import { hashPassword } from '../utils/password.js';

export const api = () => request(app);
export const PASSWORD = 'Password123';

/** Drops and recreates every table in the TEST database. */
export async function setupDb() {
  if (!/_test\b/.test(config.databaseUrl)) throw new Error('Refusing to run tests against a non-test database');
  await connectDB({ force: true });
}
export const teardownDb = () => disconnectDB();

/** Create a user directly (bypassing the API) and return { user, token, auth() }. */
export async function makeUser(role, name = role, extra = {}) {
  const email = `${name.replace(/\W/g, '').toLowerCase()}-${Math.random().toString(36).slice(2, 6)}@test.dev`;
  const user = await User.create({ name, email, role, phone: '+91 90000 00000', passwordHash: await hashPassword(PASSWORD), ...extra });
  const customer = role === 'customer' ? await Customer.create({ userId: user.id, name, email, phone: '+91 90000 00000' }) : null;
  const res = await api().post('/api/v1/auth/login').send({ email, password: PASSWORD });
  const token = res.body.data.token;
  return { user, customer, token, email, auth: (r) => r.set('Authorization', `Bearer ${token}`) };
}

/** Next non-Sunday date (≥ 3 days out) at the given local hour. */
export function futureSlot(hour = 10, minute = 0, daysAhead = 3) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  while (d.getDay() === 0) d.setDate(d.getDate() + 1);
  d.setHours(hour, minute, 0, 0);
  return d;
}

let n = 0;
export const uniqueReg = () => `KA${String(++n).padStart(2, '0')}TS${Math.floor(1000 + Math.random() * 8999)}`;
