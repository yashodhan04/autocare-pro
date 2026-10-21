/**
 * seed.js — DEVELOPMENT FIXTURES ONLY.
 *
 * Creates one account per role, a service catalogue, suppliers, spare parts and a demo
 * customer with a vehicle so the app is explorable on a fresh database.
 * Refuses to run in production. Re-running is safe (find-or-create by natural key).
 *
 *   npm run seed            add/refresh fixtures
 *   npm run seed -- --reset drop and recreate every table first (dev only)
 */
import { config } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User, Customer, Vehicle, ServiceCatalog, Supplier, InventoryItem } from '../models/index.js';
import { hashPassword } from '../utils/password.js';
import { applyMovement } from '../services/inventory.service.js';

if (config.isProduction) { console.error('Refusing to seed a production database.'); process.exit(1); }

export const DEV_PASSWORD = 'Password123';
const ACCOUNTS = [
  ['Sam Super', 'super@autocare.dev', 'super_admin'],
  ['Wendy Workshop', 'admin@autocare.dev', 'workshop_admin'],
  ['Adam Advisor', 'advisor@autocare.dev', 'service_advisor'],
  ['Mike Mechanic', 'mechanic@autocare.dev', 'mechanic'],
  ['Mona Mechanic', 'mechanic2@autocare.dev', 'mechanic'],
  ['Ian Inventory', 'inventory@autocare.dev', 'inventory_manager'],
  ['Cathy Cashier', 'cashier@autocare.dev', 'cashier'],
  ['Carl Customer', 'customer@autocare.dev', 'customer'],
];

const SERVICES = [
  ['General Service', 'Full multi-point service with oil, filter and fluid top-up', 'general', 2500, 120],
  ['Engine Oil Change', 'Engine oil and oil filter replacement', 'oil', 1200, 45],
  ['Brake Inspection', 'Pad, disc and fluid inspection with adjustment', 'brakes', 600, 45],
  ['Brake Pad Replacement', 'Front or rear brake pad replacement', 'brakes', 2200, 90],
  ['Tyre Rotation & Balancing', 'Rotation, balancing and pressure check', 'tyres', 900, 60],
  ['Battery Replacement', 'Battery test and replacement', 'battery', 400, 30],
  ['AC Service', 'AC gas top-up, filter clean and leak check', 'ac', 1800, 90],
  ['Engine Diagnostics', 'Computer diagnostics and fault-code report', 'engine', 800, 60],
];
const SUPPLIERS = [
  ['AutoParts Hub', 'Ravi Menon', 'sales@autopartshub.example', '+91 98765 43210'],
  ['Tyre World Distributors', 'Anita Shah', 'orders@tyreworld.example', '+91 98111 22334'],
];
const PARTS = [
  ['Engine Oil 5W-30 (1L)', 'OIL-5W30', 'fluids', 0, 380, 520, 40, 10, 'A1'],
  ['Oil Filter', 'FLT-OIL-01', 'filters', 0, 150, 260, 25, 8, 'A2'],
  ['Brake Pad Set (Front)', 'BRK-PAD-F', 'brakes', 0, 1100, 1650, 12, 4, 'B1'],
  ['Air Filter', 'FLT-AIR-01', 'filters', 0, 220, 380, 3, 6, 'A3'],
  ['Car Battery 12V 45Ah', 'BAT-45AH', 'battery', 0, 3800, 5200, 6, 2, 'C1'],
  ['AC Refrigerant R134a (500g)', 'AC-R134A', 'fluids', 1, 420, 650, 15, 5, 'D1'],
];

await connectDB({ force: process.argv.includes('--reset') });
if (process.argv.includes('--reset')) console.log('Database reset.');

const passwordHash = await hashPassword(DEV_PASSWORD);
for (const [name, email, role] of ACCOUNTS) {
  const [user] = await User.findOrCreate({ where: { email }, defaults: { name, email, role, passwordHash, phone: '+91 90000 00000' } });
  await user.update({ name, role, passwordHash, isActive: true });
  if (role === 'customer') {
    const [c] = await Customer.findOrCreate({ where: { userId: user.id }, defaults: { userId: user.id, name, email, phone: '+91 90000 00000', address: '12 MG Road, Bengaluru' } });
    await Vehicle.findOrCreate({ where: { registrationNumber: 'KA01AB1234' }, defaults: { customerId: c.id, registrationNumber: 'KA01AB1234', make: 'Maruti', model: 'Swift', year: 2019, fuelType: 'petrol', vehicleType: 'car', odometer: 42150, color: 'Silver' } });
  }
}
for (const [name, description, category, estimatedPrice, estimatedDurationMinutes] of SERVICES) {
  await ServiceCatalog.findOrCreate({ where: { name }, defaults: { name, description, category, estimatedPrice, estimatedDurationMinutes } });
}
const sup = [];
for (const [name, contactPerson, email, phone] of SUPPLIERS) sup.push((await Supplier.findOrCreate({ where: { name }, defaults: { name, contactPerson, email, phone } }))[0]);
const stockUser = await User.findOne({ where: { email: 'inventory@autocare.dev' } });
for (const [name, sku, category, s, purchasePrice, sellingPrice, qty, reorderLevel, location] of PARTS) {
  const [item, isNew] = await InventoryItem.findOrCreate({ where: { sku }, defaults: { name, sku, category, supplierId: sup[s].id, purchasePrice, sellingPrice, reorderLevel, location, quantity: 0 } });
  if (isNew) await applyMovement({ itemId: item.id, type: 'in', quantity: qty, reason: 'opening', by: stockUser.id, note: 'Seed opening stock' });
}

console.log('\nDevelopment fixtures ready. All accounts use password:', DEV_PASSWORD);
ACCOUNTS.forEach(([, email, role]) => console.log(`  ${role.padEnd(18)} ${email}`));
await disconnectDB();
