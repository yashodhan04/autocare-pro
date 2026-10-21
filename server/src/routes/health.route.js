/**
 * health.route.js — Health and readiness endpoints
 *
 * GET /api/v1/health        — Reports that the server process is alive.
 * GET /api/v1/health/ready  — Reports whether the app is ready to serve
 *                             database-dependent requests.
 *
 * The readiness check runs `SELECT 1` against MySQL.
 */

import { Router } from 'express';
import { sequelize } from '../config/db.js';

const router = Router();

// ── GET /api/v1/health ─────────────────────────────────────────────────────
router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    message: 'AutoCare Pro API is running',
    version: '0.1.0',
    environment: process.env.NODE_ENV ?? 'development',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

// ── GET /api/v1/health/ready ───────────────────────────────────────────────
router.get('/ready', async (_req, res) => {
  let dbStatus = 'connected';
  try { await sequelize.query('SELECT 1'); } catch { dbStatus = 'disconnected'; }
  const isReady = dbStatus === 'connected';
  res.status(isReady ? 200 : 503).json({
    success: isReady,
    status: isReady ? 'ready' : 'not_ready',
    message: isReady ? 'Application is ready to handle requests' : 'Application is not yet ready — database not reachable',
    checks: { database: { status: dbStatus } },
    timestamp: new Date().toISOString(),
  });
});

export default router;
