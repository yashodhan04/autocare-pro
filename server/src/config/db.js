import { Sequelize } from 'sequelize';
import { config } from './env.js';

// Store/read DATETIMEs in the server's local offset so DATE() grouping in reports matches workshop-local days.
const offsetMin = -new Date().getTimezoneOffset();
const timezone = `${offsetMin >= 0 ? '+' : '-'}${String(Math.floor(Math.abs(offsetMin) / 60)).padStart(2, '0')}:${String(Math.abs(offsetMin) % 60).padStart(2, '0')}`;

export const sequelize = new Sequelize(config.databaseUrl, {
  dialect: 'mysql',
  logging: false,
  timezone,
  pool: { max: 10, min: 0, idle: 10_000 },
  define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
});

/**
 * Connect and make sure tables exist. `sync()` only creates missing tables (never alters/drops),
 * so it is safe on every start. For schema changes on a live database, apply them with SQL.
 */
export async function connectDB({ force = false } = {}) {
  await sequelize.authenticate();
  await import('../models/index.js'); // registers models + associations
  await sequelize.sync({ force });
  return sequelize;
}

export const disconnectDB = () => sequelize.close();
