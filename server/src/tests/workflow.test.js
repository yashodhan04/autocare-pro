import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { api, setupDb, teardownDb, makeUser, futureSlot, uniqueReg } from './helpers.js';

const U = {};
let service, part, vehicle, appt, job, estimate;
const call = (u, method, url, body) => u.auth(api()[method](`/api/v1${url}`).send(body));
const get = (u, url) => u.auth(api().get(`/api/v1${url}`));

beforeAll(async () => {
  await setupDb();
  for (const r of ['workshop_admin', 'service_advisor', 'mechanic', 'inventory_manager', 'cashier', 'customer']) U[r] = await makeUser(r);
  service = (await call(U.workshop_admin, 'post', '/services', { name: 'General Service', estimatedPrice: 2500, estimatedDurationMinutes: 120 })).body.data;
  part = (await call(U.inventory_manager, 'post', '/inventory', { name: 'Oil Filter', sku: 'OF-1', category: 'filters', purchasePrice: 100, sellingPrice: 200, quantity: 5, reorderLevel: 2 })).body.data;
  vehicle = (await call(U.customer, 'post', '/vehicles', { registrationNumber: uniqueReg(), make: 'Maruti', model: 'Swift', year: 2019, fuelType: 'petrol', odometer: 40000 })).body.data;
});
afterAll(teardownDb);

describe('complete service workflow', () => {
  it('1. customer books, advisor confirms', async () => {
    appt = (await call(U.customer, 'post', '/appointments', { vehicle: vehicle._id, service: service._id, start: futureSlot(10), issue: 'Service due' })).body.data;
    const c = await call(U.service_advisor, 'patch', `/appointments/${appt._id}/status`, { status: 'confirmed' });
    expect(c.body.data.status).toBe('confirmed');
  });

  it('2. check-in creates a job card from the appointment (and validates odometer)', async () => {
    const low = await call(U.service_advisor, 'post', '/jobs', { appointment: appt._id, reportedProblem: 'Regular service', odometerIn: 100 });
    expect(low.status).toBe(400);
    const r = await call(U.service_advisor, 'post', '/jobs', { appointment: appt._id, reportedProblem: 'Regular service', odometerIn: 40500, priority: 'high', assignedMechanic: U.mechanic.user.id });
    expect(r.status).toBe(201);
    job = r.body.data;
    expect(job.jobNo).toMatch(/^JC-/);
    expect(job.status).toBe('checked_in');
    expect(job.services).toHaveLength(1);
    expect((await call(U.service_advisor, 'post', '/jobs', { appointment: appt._id, reportedProblem: 'dup', odometerIn: 40500 })).status).toBe(409);
  });

  it('3. estimate cannot be written before an inspection exists', async () => {
    const r = await call(U.service_advisor, 'post', '/estimates', { job: job._id, lines: [{ kind: 'labour', description: 'Labour', quantity: 1, unitPrice: 500 }] });
    expect(r.status).toBe(409);
    expect(r.body.message).toMatch(/inspection/i);
  });

  it('4. mechanic records inspection → job awaits estimate', async () => {
    const r = await call(U.mechanic, 'post', '/inspections', { job: job._id, items: [{ component: 'Brakes', status: 'attention', comment: 'Pads thin' }, { component: 'Tyres', status: 'pass' }], recommendedRepairs: [{ description: 'Replace brake pads', severity: 'high' }] });
    expect(r.status).toBe(201);
    expect(r.body.data.inspector.name).toBe('mechanic');
    expect((await get(U.service_advisor, `/jobs/${job._id}`)).body.data.status).toBe('awaiting_estimate');
  });

  it('5. estimate totals are computed server-side (tax after discount)', async () => {
    const r = await call(U.service_advisor, 'post', '/estimates', {
      job: job._id, taxRate: 18, discount: 100,
      lines: [{ kind: 'labour', description: 'Service labour', quantity: 2, unitPrice: 500 }, { kind: 'part', description: 'Oil Filter', inventoryItem: part._id, quantity: 2, unitPrice: 200 }],
    });
    expect(r.status).toBe(201);
    estimate = r.body.data;
    // subtotal 1400, discount 100 → taxable 1300, tax 234 → total 1534
    expect(estimate).toMatchObject({ subtotal: 1400, discount: 100, taxAmount: 234, total: 1534, revision: 1, status: 'draft' });
    // customers cannot see drafts
    expect((await get(U.customer, `/estimates/${estimate._id}`)).status).toBe(404);
  });

  it('6. work cannot start before the customer approves', async () => {
    await call(U.service_advisor, 'post', `/estimates/${estimate._id}/submit`);
    expect((await get(U.service_advisor, `/jobs/${job._id}`)).body.data.status).toBe('awaiting_approval');
    const r = await call(U.mechanic, 'post', `/jobs/${job._id}/transition`, { to: 'in_progress' });
    expect(r.status).toBe(409);
  });

  it('7. customer approves; decision is timestamped and job becomes approved', async () => {
    expect((await call(U.mechanic, 'post', `/estimates/${estimate._id}/decision`, { decision: 'approve' })).status).toBe(403);
    const r = await call(U.customer, 'post', `/estimates/${estimate._id}/decision`, { decision: 'approve', note: 'Go ahead' });
    expect(r.body.data.status).toBe('approved');
    const d = r.body.data.decisions.at(-1);
    expect(d).toMatchObject({ action: 'approved', note: 'Go ahead', onBehalf: false });
    expect(d.at).toBeTruthy();
    expect((await get(U.service_advisor, `/jobs/${job._id}`)).body.data.status).toBe('approved');
    expect((await call(U.customer, 'post', `/estimates/${estimate._id}/decision`, { decision: 'reject' })).status).toBe(409); // already decided
  });

  it('8. mechanic starts work; parts request → issue deducts stock atomically', async () => {
    expect((await call(U.mechanic, 'post', `/jobs/${job._id}/transition`, { to: 'in_progress' })).status).toBe(200);
    const pr = await call(U.mechanic, 'post', `/jobs/${job._id}/part-requests`, { item: part._id, quantity: 2 });
    expect(pr.status).toBe(200);
    const reqId = pr.body.data.partRequests[0]._id;
    expect((await call(U.mechanic, 'patch', `/jobs/${job._id}/part-requests/${reqId}`, { action: 'issue' })).status).toBe(403); // not stock role
    const issue = await call(U.inventory_manager, 'patch', `/jobs/${job._id}/part-requests/${reqId}`, { action: 'issue' });
    expect(issue.body.data.partRequests[0].status).toBe('issued');
    expect((await get(U.inventory_manager, `/inventory/${part._id}`)).body.data.quantity).toBe(3);
    const mv = await get(U.inventory_manager, `/inventory/movements?item=${part._id}`);
    expect(mv.body.data[0]).toMatchObject({ reason: 'job_issue', delta: -2 });
    // cannot be issued twice
    expect((await call(U.inventory_manager, 'patch', `/jobs/${job._id}/part-requests/${reqId}`, { action: 'issue' })).status).toBe(409);
  });

  it('9. insufficient stock leaves the request pending', async () => {
    const pr = await call(U.mechanic, 'post', `/jobs/${job._id}/part-requests`, { item: part._id, quantity: 99 });
    const reqId = pr.body.data.partRequests.at(-1)._id;
    const r = await call(U.inventory_manager, 'patch', `/jobs/${job._id}/part-requests/${reqId}`, { action: 'issue' });
    expect(r.status).toBe(409);
    await call(U.inventory_manager, 'patch', `/jobs/${job._id}/part-requests/${reqId}`, { action: 'reject', note: 'Too many' });
  });

  it('10. revising an approved estimate pauses the job until re-approval', async () => {
    const r = await call(U.service_advisor, 'post', '/estimates', { job: job._id, taxRate: 18, discount: 0, lines: [...estimate.lines.map(({ amount, ...l }) => l), { kind: 'labour', description: 'Extra: brake pads', quantity: 1, unitPrice: 800 }] });
    expect(r.body.data.revision).toBe(2);
    expect((await call(U.service_advisor, 'post', '/estimates', { job: job._id, lines: [{ kind: 'labour', description: 'x', quantity: 1, unitPrice: 1 }] })).status).toBe(409); // one open revision at a time
    await call(U.service_advisor, 'post', `/estimates/${r.body.data._id}/submit`);
    expect((await get(U.service_advisor, `/jobs/${job._id}`)).body.data.status).toBe('awaiting_approval');
    // mechanic cannot log work while paused
    expect((await call(U.mechanic, 'post', `/jobs/${job._id}/tasks`, { description: 'x' })).status).toBe(409);
    const ap = await call(U.customer, 'post', `/estimates/${r.body.data._id}/decision`, { decision: 'approve' });
    expect(ap.body.data).toMatchObject({ status: 'approved', revision: 2, subtotal: 2200, total: 2596 });
    expect((await get(U.service_advisor, `/jobs/${job._id}`)).body.data.status).toBe('in_progress'); // resumes
    const rev1 = await get(U.service_advisor, `/estimates/${estimate._id}`);
    expect(rev1.body.data.status).toBe('superseded');
    estimate = ap.body.data;
  });

  it('11. mechanic logs tasks + time and submits for quality check', async () => {
    const t = await call(U.mechanic, 'post', `/jobs/${job._id}/tasks`, { description: 'Replace oil filter' });
    await call(U.mechanic, 'patch', `/jobs/${job._id}/tasks/${t.body.data.tasks[0]._id}`, { done: true });
    const tl = await call(U.mechanic, 'post', `/jobs/${job._id}/time-logs`, { minutes: 90, note: 'Service' });
    expect(tl.body.data.labourMinutes).toBe(90);
    expect((await call(U.mechanic, 'post', `/jobs/${job._id}/transition`, { to: 'quality_check' })).status).toBe(200);
    // mechanic has no authority to pass QC or invoice
    expect((await call(U.mechanic, 'post', `/jobs/${job._id}/quality-check`, { passed: true })).status).toBe(403);
    const other = await makeUser('mechanic', 'other-mech');
    expect((await call(other, 'post', `/jobs/${job._id}/notes`, { text: 'hi' })).status).toBe(403); // not assigned
  });

  it('12. cannot invoice before quality check passes; then invoice is built from the approved estimate', async () => {
    expect((await call(U.cashier, 'post', '/invoices', { job: job._id })).status).toBe(409);
    expect((await call(U.service_advisor, 'post', `/jobs/${job._id}/quality-check`, { passed: true })).body.data.status).toBe('completed');
    const inv = await call(U.cashier, 'post', '/invoices', { job: job._id });
    expect(inv.status).toBe(201);
    expect(inv.body.data).toMatchObject({ subtotal: 2200, taxAmount: 396, total: 2596, balance: 2596, amountPaid: 0, status: 'unpaid' });
    expect(inv.body.data.invoiceNo).toMatch(/^INV-/);
    expect((await call(U.cashier, 'post', '/invoices', { job: job._id })).status).toBe(409);
    job.invoice = inv.body.data;
  });

  it('13. payments: partial, overpayment rejected, delivery blocked until fully paid', async () => {
    const id = job.invoice._id;
    const p1 = await call(U.cashier, 'post', '/payments', { invoice: id, amount: 1000, method: 'cash' });
    expect(p1.status).toBe(201);
    expect(p1.body.data.invoice).toMatchObject({ status: 'partial', balance: 1596, amountPaid: 1000 });
    expect((await call(U.cashier, 'post', '/payments', { invoice: id, amount: 5000, method: 'cash' })).status).toBe(400);
    expect((await call(U.cashier, 'post', '/payments', { invoice: id, amount: -5, method: 'cash' })).status).toBe(400);
    expect((await call(U.service_advisor, 'post', `/jobs/${job._id}/transition`, { to: 'delivered' })).status).toBe(409);
    const p2 = await call(U.cashier, 'post', '/payments', { invoice: id, amount: 1596, method: 'test' });
    expect(p2.body.data.invoice).toMatchObject({ status: 'paid', balance: 0 });
    expect(p2.body.data.payment.isTest).toBe(true);
    expect((await call(U.cashier, 'post', '/payments', { invoice: id, amount: 1, method: 'cash' })).status).toBe(400);
  });

  it('14. delivery updates history, odometer and maintenance reminders', async () => {
    await call(U.service_advisor, 'post', '/maintenance-plans', { vehicle: vehicle._id, title: 'Periodic service', intervalDays: 180, intervalKm: 10000 });
    const d = await call(U.service_advisor, 'post', `/jobs/${job._id}/transition`, { to: 'delivered' });
    expect(d.status).toBe(200);
    const v = await get(U.customer, `/vehicles/${vehicle._id}/history`);
    expect(v.body.data.vehicle.odometer).toBe(40500);
    expect(v.body.data.history).toHaveLength(1);
    expect(v.body.data.history[0].partsReplaced).toEqual([expect.objectContaining({ name: 'Oil Filter', quantity: 2 })]);
    expect(v.body.data.history[0].invoice.status).toBe('paid');
    expect(v.body.data.plans[0]).toMatchObject({ lastServiceOdometer: 40500, nextDueOdometer: 50500 });
    const appts = await get(U.customer, '/appointments');
    expect(appts.body.data[0].status).toBe('completed');
  });

  it('15. reviews: only after delivery, once per job, moderated', async () => {
    const rv = await get(U.customer, '/reviews/reviewable');
    expect(rv.body.data).toHaveLength(1);
    const r = await call(U.customer, 'post', '/reviews', { job: job._id, rating: 5, comment: 'Great' });
    expect(r.status).toBe(201);
    expect(r.body.data.status).toBe('pending');
    expect((await call(U.customer, 'post', '/reviews', { job: job._id, rating: 4 })).status).toBe(409);
    expect((await call(U.customer, 'patch', `/reviews/${r.body.data._id}/moderate`, { status: 'approved' })).status).toBe(403);
    expect((await call(U.workshop_admin, 'patch', `/reviews/${r.body.data._id}/moderate`, { status: 'approved' })).body.data.status).toBe('approved');
  });

  it('16. customer received in-app notifications along the way; audit trail exists', async () => {
    const n = await get(U.customer, '/notifications?limit=50');
    const types = n.body.data.map((x) => x.type);
    expect(types).toEqual(expect.arrayContaining(['estimate.approval_requested', 'payment.received', 'job.completed']));
    expect(n.body.pagination.unread).toBeGreaterThan(0);
    expect((await call(U.customer, 'post', '/notifications/read-all')).status).toBe(200);
    const logs = await get(U.workshop_admin, '/audit-logs?limit=100');
    const actions = logs.body.data.map((l) => l.action);
    expect(actions).toEqual(expect.arrayContaining(['estimate.approve', 'invoice.create', 'payment.record', 'job.create', 'parts.issued']));
    expect(logs.body.data[0]).toMatchObject({ actorName: expect.any(String), actorRole: expect.any(String) });
  });

  it('17. dashboards return real, role-specific data', async () => {
    const staff = await get(U.workshop_admin, '/reports/dashboard');
    expect(staff.body.data.kind).toBe('staff');
    expect(staff.body.data.stats.customers).toBeGreaterThanOrEqual(1);
    expect(staff.body.data.revenue.month).toBe(2596);
    const adv = await get(U.service_advisor, '/reports/dashboard');
    expect(adv.body.data.revenue).toBeUndefined(); // advisors don't see revenue
    expect((await get(U.customer, '/reports/dashboard')).body.data.kind).toBe('customer');
    expect((await get(U.mechanic, '/reports/dashboard')).body.data.kind).toBe('mechanic');
    const rev = await get(U.workshop_admin, '/reports/revenue');
    expect(rev.body.data.total).toBe(2596);
    expect(rev.body.data.series.length).toBe(30);
    expect((await get(U.mechanic, '/reports/revenue')).status).toBe(403);
    for (const r of ['services', 'pending-jobs', 'appointments', 'inventory-movement', 'low-stock', 'mechanic-workload', 'customer-activity']) {
      expect((await get(U.workshop_admin, `/reports/${r}`)).status, r).toBe(200);
    }
  });
});
