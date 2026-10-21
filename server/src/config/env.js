/**
 * env.js — Environment configuration
 *
 * Reads and validates process.env values.
 * Import this module anywhere you need config; never read process.env directly.
 */

import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT ?? '5000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongodbUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/autocare_pro',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',

  get isDevelopment() {
    return this.nodeEnv === 'development';
  },
  get isProduction() {
    return this.nodeEnv === 'production';
  },
};
