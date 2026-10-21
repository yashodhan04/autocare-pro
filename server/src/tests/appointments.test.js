import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { api, setupDb, teardownDb, makeUser, futureSlot, uniqueReg } from './helpers.js';
import { config } from '../config/env.js';

let admin, advisor, cust, service;
const vehicles = [];
const post = (u, url, body) => u.auth(api().post(url).send(body));

async function newVehicle(owner) {
  const r = await owner.auth(api().post('/api/v1/vehicles').send({ registrationNumber: uniqueReg(), make: 'Hyundai', model: 'i20', year: 2021, fuelType: 'petrol' }));
  expect(r.status).toBe(201);
  return r.body.data;
}

beforeAll(async () => {
  await setupDb();
  [admin, advisor, cust] = await Promise.all([makeUser('workshop_admin'), makeUser('service_advisor'), makeUser('customer')]);
  const s = await post(admin, '/api/v1/services', { name: 'Oil Change', category: 'oil', estimatedPrice: 1000, estimatedDurationMinutes: 60 });
  service = s.body.data;
  for (let i = 0; i < config.workshop.bays + 1; i++) vehicles.push(await newVehicle(cust));
});
afterAll(teardownDb);

describe('appointment booking rules (server-side)', () => {
  const start = futureSlot(10);

  it('books an available slot as pending', async () => {
    const r = await post(cust, '/api/v1/appointments', { vehicle: vehicles[0]._id, service: service._id, start, issue: 'Noise' });
    expect(r.status).toBe(201);
    expect(r.body.data.status).toBe('pending');
    expect(r.body.data.appointmentNo).toMatch(/^AP-/);
  });

  it('rejects past dates, closed days, off-grid and out-of-hours times', async () => {
    const body = (d) => ({ vehicle: vehicles[1]._id, service: service._id, start: d });
    expect((await post(cust, '/api/v1/appointments', body(new Date(Date.now() - 3600_000)))).status).toBe(400);
    const sunday = futureSlot(10); while (sunday.getDay() !== 0) sunday.setDate(sunday.getDate() + 1);
    expect((await post(cust, '/api/v1/appointments', body(sunday))).body.message).toMatch(/closed/i);
    expect((await post(cust, '/api/v1/appointments', body(futureSlot(10, 15)))).status).toBe(400);
    expect((await post(cust, '/api/v1/appointments', body(futureSlot(7)))).body.message).toMatch(/opening hours/i);
    expect((await post(cust, '/api/v1/appointments', body(futureSlot(17, 30)))).body.message).toMatch(/opening hours/i);
  });

  it('prevents the same vehicle from double-booking an overlapping time', async () => {
    const r = await post(cust, '/api/v1/appointments', { vehicle: vehicles[0]._id, service: service._id, start: futureSlot(10, 30) });
    expect(r.status).toBe(409);
    expect(r.body.message).toMatch(/already has a booking/i);
  });

  it('refuses bookings once all bays are taken, and exposes it in availability', async () => {
    const t = futureSlot(14);
    for (let i = 1; i < config.workshop.bays; i++) {
      expect((await post(advisor, '/api/v1/appointments', { vehicle: vehicles[i]._id, service: service._id, start: t })).status).toBe(201);
    }
    // bays - 1 booked at 14:00 plus none at 10:00 → fill remaining bay then overflow
    const filler = await newVehicle(cust);
    expect((await post(advisor, '/api/v1/appointments', { vehicle: filler._id, service: service._id, start: t })).status).toBe(201);
    const overflow = await post(advisor, '/api/v1/appointments', { vehicle: vehicles[config.workshop.bays]._id, service: service._id, start: futureSlot(14, 30) });
    expect(overflow.status).toBe(409);
    expect(overflow.body.message).toMatch(/fully booked/i);

    const date = t.toLocaleDateString('en-CA');
    const av = await cust.auth(api().get(`/api/v1/appointments/availability?service=${service._id}&date=${date}`));
    const slot = av.body.data.slots.find((s) => new Date(s.start).getTime() === t.getTime());
    expect(slot.available).toBe(false);
  });

  it('lets the customer reschedule (back to pending) but staff confirm/reject with a reason', async () => {
    const v = await newVehicle(cust);
    const a = (await post(cust, '/api/v1/appointments', { vehicle: v._id, service: service._id, start: futureSlot(9, 0, 5) })).body.data;
    const conf = await advisor.auth(api().patch(`/api/v1/appointments/${a._id}/status`).send({ status: 'confirmed' }));
    expect(conf.body.data.status).toBe('confirmed');
    const re = await cust.auth(api().patch(`/api/v1/appointments/${a._id}/reschedule`).send({ start: futureSlot(11, 0, 5) }));
    expect(re.status).toBe(200);
    expect(re.body.data.status).toBe('pending');
    expect((await advisor.auth(api().patch(`/api/v1/appointments/${a._id}/status`).send({ status: 'rejected' }))).status).toBe(400);
    expect((await advisor.auth(api().patch(`/api/v1/appointments/${a._id}/status`).send({ status: 'rejected', reason: 'Fully booked' }))).body.data.status).toBe('rejected');
    // customers cannot confirm their own bookings
    expect((await cust.auth(api().patch(`/api/v1/appointments/${a._id}/status`).send({ status: 'confirmed' }))).status).toBe(403);
  });

  it('refuses a customer booking someone else\'s vehicle', async () => {
    const other = await makeUser('customer', 'other');
    const r = await post(other, '/api/v1/appointments', { vehicle: vehicles[0]._id, service: service._id, start: futureSlot(16, 0, 6) });
    expect(r.status).toBe(403);
  });
});
