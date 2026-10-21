/**
 * errorHandler.js — Global error-handling middleware
 *
 * Must be registered LAST in the Express middleware chain (4 arguments).
 * Catches any error passed via next(err) and returns a structured JSON response.
 */

import { config } from '../config/env.js';

/**
 * @param {Error}                      err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next  — required 4th param for Express to treat as error handler
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode ?? err.status ?? 500;

  // Log the full error in development; keep it quiet in production
  if (config.isDevelopment) {
    console.error('[Error]', err);
  } else {
    console.error(`[Error] ${statusCode} — ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: err.message ?? 'Internal Server Error',
    // Only expose stack trace in development
    ...(config.isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
}
