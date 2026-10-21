/**
 * errorHandler.js — Global error-handling middleware (registered LAST).
 * Normalises Zod / Sequelize / JWT / duplicate-key errors into the standard JSON envelope
 * and never leaks SQL or internal error text for unexpected failures.
 */

import { ZodError } from 'zod';
import { ValidationError, UniqueConstraintError, ForeignKeyConstraintError, DatabaseError } from 'sequelize';
import { config } from '../config/env.js';

function normalise(err) {
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return { status: 400, message: details[0] ? `${details[0].field ? details[0].field + ': ' : ''}${details[0].message}` : 'Validation failed', details };
  }
  if (err instanceof UniqueConstraintError) {
    const field = err.errors?.[0]?.path?.replace(/^.*\./, '') ?? 'value';
    return { status: 409, message: `A record with this ${field} already exists`, details: [{ field, message: 'must be unique' }] };
  }
  if (err instanceof ValidationError) {
    const details = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return { status: 400, message: details[0]?.message ?? 'Validation failed', details };
  }
  if (err instanceof ForeignKeyConstraintError) return { status: 409, message: 'This record is referenced by other data or points to something that does not exist' };
  if (err instanceof DatabaseError && /out of range/i.test(err.message)) return { status: 409, message: 'Value out of allowed range (e.g. stock cannot go below zero)' };
  if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') return { status: 401, message: 'Invalid or expired session. Please sign in again.' };
  if (err?.type === 'entity.parse.failed') return { status: 400, message: 'Malformed JSON body' };
  if (err?.isOperational) return { status: err.statusCode, message: err.message, details: err.details };
  return { status: 500, message: 'Something went wrong on our side. Please try again.' };
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const { status, message, details } = normalise(err);
  if (status >= 500 && !config.isTest) console.error('[Error]', err);

  res.status(status).json({
    success: false,
    status,
    message,
    ...(details && { details }),
    ...(config.isDevelopment && status >= 500 && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
}
