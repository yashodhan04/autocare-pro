/**
 * notFound.js — 404 handler middleware
 *
 * Catches any request that did not match a registered route
 * and returns a structured JSON 404 response.
 */

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export function notFound(req, res) {
  res.status(404).json({
    success: false,
    status: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
}
