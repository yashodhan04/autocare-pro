import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isTest ? 10_000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, status: 429, message: 'Too many attempts. Please try again later.' },
});
