/**
 * app.js — Express application factory
 *
 * Creates and configures the Express application.
 * Separating app creation from server.js makes the app
 * importable in tests without starting a real HTTP server.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import api from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ── Security middleware ────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.clientUrls,
    credentials: true,
  })
);

// ── Request logging ────────────────────────────────────────────────────────
if (config.isTest) {
  // quiet
} else if (config.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Body parsing ───────────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// CSRF defence for cookie sessions: state-changing requests must come from an allowed origin
// (in addition to SameSite cookies and JSON-only body parsing).
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && origin && !config.clientUrls.includes(origin)) {
    return res.status(403).json({ success: false, status: 403, message: 'Request origin not allowed' });
  }
  next();
});

// ── API routes ─────────────────────────────────────────────────────────────
app.use('/api/v1', api);

// Catch-all for unmatched routes — must come after all real route registrations
app.use(notFound);

// Global error handler — must be the last middleware (4 arguments)
app.use(errorHandler);

export default app;
