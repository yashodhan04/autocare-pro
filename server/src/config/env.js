/**
 * env.js — Environment configuration
 *
 * Reads and validates process.env values.
 * Import this module anywhere you need config; never read process.env directly.
 */

import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV ?? 'development';
const int = (v, d) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d);

if (nodeEnv === 'production') {
  const missing = ['JWT_SECRET', 'DATABASE_URL'].filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}

export const config = {
  port: int(process.env.PORT, 5000),
  nodeEnv,
  databaseUrl:
    nodeEnv === 'test'
      ? process.env.DATABASE_URL_TEST ?? 'mysql://root:@127.0.0.1:3306/autocare_pro_test'
      : process.env.DATABASE_URL ?? 'mysql://root:@127.0.0.1:3306/autocare_pro',
  clientUrls: (process.env.CLIENT_URL ?? 'http://localhost:5173').split(',').map((s) => s.trim()),
  // ponytail: insecure fallback only outside production so tests/dev run without setup
  jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  workshop: {
    openHour: int(process.env.WORKSHOP_OPEN_HOUR, 8),
    closeHour: int(process.env.WORKSHOP_CLOSE_HOUR, 18),
    bays: int(process.env.WORKSHOP_BAYS, 3),
    slotMinutes: 30,
    closedWeekdays: [0], // Sunday
  },
  defaultTaxRate: int(process.env.DEFAULT_TAX_RATE, 18),

  get clientUrl() {
    return this.clientUrls[0];
  },
  get isDevelopment() {
    return this.nodeEnv === 'development';
  },
  get isProduction() {
    return this.nodeEnv === 'production';
  },
  get isTest() {
    return this.nodeEnv === 'test';
  },
};
