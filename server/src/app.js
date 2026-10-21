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
import { config } from './config/env.js';
import healthRouter from './routes/health.route.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ── Security middleware ────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

// ── Request logging ────────────────────────────────────────────────────────
if (config.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── API routes ─────────────────────────────────────────────────────────────
app.use('/api/v1/health', healthRouter);

// Catch-all for unmatched routes — must come after all real route registrations
app.use(notFound);

// Global error handler — must be the last middleware (4 arguments)
app.use(errorHandler);

export default app;
