import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { api, setupDb, teardownDb, makeUser, PASSWORD } from './helpers.js';

beforeAll(setupDb);
afterAll(teardownDb);

describe('authentication', () => {
  it('registers a customer, hashes the password and returns a token', async () => {
    const res = await api().post('/api/v1/auth/register').send({ name: 'Rita', email: 'Rita@Test.dev', password: PASSWORD, phone: '+91 98765 43210' });
    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.role).toBe('customer');
    expect(res.body.data.user.email).toBe('rita@test.dev');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects duplicate emails and weak passwords with clear messages', async () => {
    const dup = await api().post('/api/v1/auth/register').send({ name: 'Rita', email: 'rita@test.dev', password: PASSWORD, phone: '+91 98765 43210' });
    expect(dup.status).toBe(409);
    const weak = await api().post('/api/v1/auth/register').send({ name: 'X', email: 'x@test.dev', password: 'short', phone: '+91 98765 43210' });
    expect(weak.status).toBe(400);
    expect(weak.body.message).toMatch(/password/i);
  });

  it('logs in with correct credentials only', async () => {
    expect((await api().post('/api/v1/auth/login').send({ email: 'rita@test.dev', password: PASSWORD })).status).toBe(200);
    const bad = await api().post('/api/v1/auth/login').send({ email: 'rita@test.dev', password: 'WrongPass1' });
    expect(bad.status).toBe(401);
    expect(bad.body.message).toBe('Incorrect email or password');
  });

  it('protects routes: no token and bad token are 401', async () => {
    expect((await api().get('/api/v1/customers')).status).toBe(401);
    expect((await api().get('/api/v1/auth/me').set('Authorization', 'Bearer nope')).status).toBe(401);
  });

  it('password reset flow issues a single-use token', async () => {
    const f = await api().post('/api/v1/auth/forgot-password').send({ email: 'rita@test.dev' });
    expect(f.status).toBe(200);
    const token = new URL(f.body.data.devResetLink).searchParams.get('token');
    expect((await api().post('/api/v1/auth/reset-password').send({ token, password: 'NewPassw0rd' })).status).toBe(200);
    expect((await api().post('/api/v1/auth/reset-password').send({ token, password: 'Another1234' })).status).toBe(400);
    expect((await api().post('/api/v1/auth/login').send({ email: 'rita@test.dev', password: 'NewPassw0rd' })).status).toBe(200);
  });

  it('does not reveal whether an email exists on forgot-password', async () => {
    const res = await api().post('/api/v1/auth/forgot-password').send({ email: 'nobody@test.dev' });
    expect(res.status).toBe(200);
    expect(res.body.data.devResetLink).toBeUndefined();
  });
});

describe('role-based access control', () => {
  it('enforces role boundaries on each module', async () => {
    const [admin, mech, cust, cashier, inv] = await Promise.all(
      ['workshop_admin', 'mechanic', 'customer', 'cashier', 'inventory_manager'].map((r) => makeUser(r)),
    );
    expect((await admin.auth(api().get('/api/v1/customers'))).status).toBe(200);
    expect((await mech.auth(api().get('/api/v1/customers'))).status).toBe(403);
    expect((await cust.auth(api().get('/api/v1/customers'))).status).toBe(403);
    expect((await cust.auth(api().get('/api/v1/audit-logs'))).status).toBe(403);
    expect((await admin.auth(api().get('/api/v1/audit-logs'))).status).toBe(200);
    expect((await cashier.auth(api().post('/api/v1/inventory').send({}))).status).toBe(403);
    expect((await inv.auth(api().get('/api/v1/inventory'))).status).toBe(200);
    expect((await mech.auth(api().post('/api/v1/services').send({ name: 'x' }))).status).toBe(403);
  });

  it('only a super admin can create admin accounts, and role changes are audited', async () => {
    const admin = await makeUser('workshop_admin');
    const sup = await makeUser('super_admin');
    const body = { name: 'New Admin', email: 'newadmin@test.dev', password: PASSWORD, role: 'workshop_admin' };
    expect((await admin.auth(api().post('/api/v1/users').send(body))).status).toBe(403);
    const ok = await sup.auth(api().post('/api/v1/users').send(body));
    expect(ok.status).toBe(201);
    const ch = await sup.auth(api().patch(`/api/v1/users/${ok.body.data._id}`).send({ role: 'cashier' }));
    expect(ch.status).toBe(200);
    const logs = await sup.auth(api().get('/api/v1/audit-logs?action=user.role_change'));
    expect(logs.body.data.length).toBeGreaterThan(0);
  });

  it('customers cannot read other customers\' vehicles', async () => {
    const a = await makeUser('customer', 'a');
    const b = await makeUser('customer', 'b');
    const v = await a.auth(api().post('/api/v1/vehicles').send({ registrationNumber: 'KA05ZZ0001', make: 'Honda', model: 'City', year: 2020, fuelType: 'petrol' }));
    expect(v.status).toBe(201);
    expect((await b.auth(api().get(`/api/v1/vehicles/${v.body.data._id}`))).status).toBe(404);
    expect((await b.auth(api().get('/api/v1/vehicles'))).body.data).toHaveLength(0);
  });
});

describe('cookie sessions', () => {
  it('sets an httpOnly session cookie that authenticates /me, and logout clears it', async () => {
    const agent = (await import('supertest')).default.agent((await import('../app.js')).default);
    const login = await agent.post('/api/v1/auth/login').send({ email: 'rita@test.dev', password: 'NewPassw0rd' });
    const cookie = login.headers['set-cookie'].find((c) => c.startsWith('autocare_session='));
    expect(cookie).toMatch(/HttpOnly/i);
    expect((await agent.get('/api/v1/auth/me')).status).toBe(200);
    await agent.post('/api/v1/auth/logout');
    expect((await agent.get('/api/v1/auth/me')).status).toBe(401);
  });

  it('rejects state-changing requests from a foreign origin', async () => {
    const res = await api().post('/api/v1/auth/login').set('Origin', 'https://evil.example').send({ email: 'a@b.co', password: 'x' });
    expect(res.status).toBe(403);
  });
});

describe('id handling', () => {
  it('rejects malformed ids instead of letting MySQL cast "1abc" to 1', async () => {
    const admin = await makeUser('workshop_admin');
    expect((await admin.auth(api().get('/api/v1/customers/1abc'))).status).toBe(404);
    expect((await admin.auth(api().get('/api/v1/customers/abc'))).status).toBe(404);
  });

  it('rejects tokens whose subject is not a numeric id (e.g. stale tokens from the previous database)', async () => {
    const jwt = (await import('jsonwebtoken')).default;
    const { config } = await import('../config/env.js');
    const old = jwt.sign({ sub: '6ad8d1f314a07be660d873d5', role: 'workshop_admin' }, config.jwtSecret);
    expect((await api().get('/api/v1/auth/me').set('Authorization', `Bearer ${old}`)).status).toBe(401);
  });
});
