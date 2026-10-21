import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { api, setupDb, teardownDb, makeUser } from './helpers.js';

let inv, mech, item, supplier;
const post = (u, url, body) => u.auth(api().post(url).send(body));

beforeAll(async () => {
  await setupDb();
  [inv, mech] = await Promise.all([makeUser('inventory_manager'), makeUser('mechanic')]);
  supplier = (await post(inv, '/api/v1/suppliers', { name: 'Parts Co', phone: '+91 98765 43210' })).body.data;
  item = (await post(inv, '/api/v1/inventory', { name: 'Brake Pad', sku: 'bp-1', category: 'brakes', supplier: supplier._id, purchasePrice: 100, sellingPrice: 150, quantity: 10, reorderLevel: 4 })).body.data;
});
afterAll(teardownDb);

describe('inventory stock movements', () => {
  it('creates opening stock as a ledger movement and normalises SKU', async () => {
    expect(item.sku).toBe('BP-1');
    expect(item.quantity).toBe(10);
    const mv = await inv.auth(api().get(`/api/v1/inventory/movements?item=${item._id}`));
    expect(mv.body.data).toHaveLength(1);
    expect(mv.body.data[0]).toMatchObject({ type: 'in', delta: 10, balanceAfter: 10, reason: 'opening' });
  });

  it('stock-out reduces quantity and records balance', async () => {
    const r = await post(inv, `/api/v1/inventory/${item._id}/movements`, { type: 'out', quantity: 3, reason: 'other' });
    expect(r.status).toBe(201);
    expect(r.body.data.item.quantity).toBe(7);
    expect(r.body.data.movement).toMatchObject({ delta: -3, balanceAfter: 7 });
  });

  it('blocks stock-out beyond available and invalid quantities', async () => {
    const over = await post(inv, `/api/v1/inventory/${item._id}/movements`, { type: 'out', quantity: 50 });
    expect(over.status).toBe(409);
    expect(over.body.message).toMatch(/insufficient stock/i);
    expect((await post(inv, `/api/v1/inventory/${item._id}/movements`, { type: 'in', quantity: -2 })).status).toBe(400);
    expect((await post(inv, `/api/v1/inventory/${item._id}/movements`, { type: 'in', quantity: 0 })).status).toBe(400);
    const now = await inv.auth(api().get(`/api/v1/inventory/${item._id}`));
    expect(now.body.data.quantity).toBe(7);
  });

  it('concurrent stock-outs can never drive stock negative', async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => post(inv, `/api/v1/inventory/${item._id}/movements`, { type: 'out', quantity: 2 })));
    expect(results.filter((r) => r.status === 201)).toHaveLength(3); // 7 → 3 successes of 2, remainder 1
    const now = await inv.auth(api().get(`/api/v1/inventory/${item._id}`));
    expect(now.body.data.quantity).toBe(1);
    expect(now.body.data.stockStatus).toBe('low_stock');
  });

  it('adjustments set an absolute quantity, require a note, and are logged', async () => {
    expect((await post(inv, `/api/v1/inventory/${item._id}/movements`, { type: 'adjust', quantity: 20 })).status).toBe(400);
    const r = await post(inv, `/api/v1/inventory/${item._id}/movements`, { type: 'adjust', quantity: 20, note: 'Stock count' });
    expect(r.body.data.item.quantity).toBe(20);
    expect(r.body.data.movement).toMatchObject({ type: 'adjust', delta: 19, reason: 'correction' });
  });

  it('direct quantity edits via PATCH are ignored', async () => {
    const r = await inv.auth(api().patch(`/api/v1/inventory/${item._id}`).send({ quantity: 999, location: 'Z9' }));
    expect(r.body.data.quantity).toBe(20);
    expect(r.body.data.location).toBe('Z9');
  });

  it('low-stock alerts list items at or below reorder level', async () => {
    await post(inv, `/api/v1/inventory/${item._id}/movements`, { type: 'out', quantity: 17 });
    const a = await inv.auth(api().get('/api/v1/inventory/alerts'));
    expect(a.body.data.map((i) => i.sku)).toContain('BP-1');
    const filtered = await inv.auth(api().get('/api/v1/inventory?status=low_stock&q=brake'));
    expect(filtered.body.data).toHaveLength(1);
  });

  it('mechanics cannot move stock', async () => {
    expect((await post(mech, `/api/v1/inventory/${item._id}/movements`, { type: 'in', quantity: 1 })).status).toBe(403);
  });
});

describe('purchase orders', () => {
  it('receives goods against ordered quantities and updates inventory', async () => {
    const po = (await post(inv, '/api/v1/purchase-orders', { supplier: supplier._id, lines: [{ item: item._id, quantity: 10, unitCost: 100 }] })).body.data;
    expect(po.total).toBe(1000);
    expect((await post(inv, `/api/v1/purchase-orders/${po._id}/receive`, { lines: [{ item: item._id, quantity: 5 }] })).status).toBe(409); // still draft
    expect((await post(inv, `/api/v1/purchase-orders/${po._id}/order`, {})).body.data.status).toBe('ordered');

    const before = (await inv.auth(api().get(`/api/v1/inventory/${item._id}`))).body.data.quantity;
    const r1 = await post(inv, `/api/v1/purchase-orders/${po._id}/receive`, { lines: [{ item: item._id, quantity: 4 }] });
    expect(r1.body.data.status).toBe('partially_received');
    expect((await post(inv, `/api/v1/purchase-orders/${po._id}/receive`, { lines: [{ item: item._id, quantity: 7 }] })).status).toBe(400); // only 6 outstanding
    const r2 = await post(inv, `/api/v1/purchase-orders/${po._id}/receive`, { lines: [{ item: item._id, quantity: 6 }] });
    expect(r2.body.data.status).toBe('received');
    const after = (await inv.auth(api().get(`/api/v1/inventory/${item._id}`))).body.data.quantity;
    expect(after - before).toBe(10);
    const sup = await inv.auth(api().get(`/api/v1/suppliers/${supplier._id}`));
    expect(sup.body.data.orders).toHaveLength(1);
    expect(sup.body.data.parts[0].sku).toBe('BP-1');
  });
});
