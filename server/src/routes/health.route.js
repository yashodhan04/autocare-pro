/**
 * health.route.js — Health and readiness endpoints
 *
 * GET /api/v1/health        — Reports that the server process is alive.
 * GET /api/v1/health/ready  — Reports whether the app is ready to serve
 *                             database-dependent requests.
 *
 * The readiness check inspects the Mongoose connection state so that when
 * MongoDB is connected in the next phase, this endpoint automatically reflects
 * the real state without any structural changes.
 *
 * Mongoose connection states:
 *   0 = disconnected | 1 = connected | 2 = connecting | 3 = disconnecting
 */

import { Router } from 'express';
import mongoose from 'mongoose';

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
router.get('/ready', (_req, res) => {
  const dbState = mongoose.connection.readyState;

  // Map Mongoose numeric state to a human-readable label
  const stateLabels = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbStatus = stateLabels[dbState] ?? 'unknown';
  const isReady = dbState === 1; // Only "connected" means ready

  const statusCode = isReady ? 200 : 503;

  res.status(statusCode).json({
    success: isReady,
    status: isReady ? 'ready' : 'not_ready',
    message: isReady
      ? 'Application is ready to handle requests'
      : 'Application is not yet ready — database not connected',
    checks: {
      database: {
        status: dbStatus,
        connected: isReady,
      },
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
