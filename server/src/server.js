/**
 * server.js — HTTP server entry point
 *
 * Starts the Express application and attaches Socket.IO.
 * MongoDB connection will be established here in the next backend phase.
 */

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { config } from './config/env.js';

// ── HTTP + Socket.IO setup ─────────────────────────────────────────────────
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.clientUrl,
    methods: ['GET', 'POST'],
  },
});

// Socket.IO stub — real event handlers will be registered in a later phase
io.on('connection', (socket) => {
  if (config.isDevelopment) {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);
  }
  socket.on('disconnect', () => {
    if (config.isDevelopment) {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    }
  });
});

// ── Start server ───────────────────────────────────────────────────────────
httpServer.listen(config.port, () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════════╗');
  console.log('  ║        AutoCare Pro — API Server          ║');
  console.log('  ╠═══════════════════════════════════════════╣');
  console.log(`  ║  Port        : ${config.port}                          ║`);
  console.log(`  ║  Environment : ${config.nodeEnv.padEnd(26)} ║`);
  console.log('  ║  Health      : GET /api/v1/health         ║');
  console.log('  ║  Readiness   : GET /api/v1/health/ready   ║');
  console.log('  ║  Database    : not connected (Step 1)     ║');
  console.log('  ╚═══════════════════════════════════════════╝');
  console.log('');
});

// ── Graceful shutdown ──────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received — shutting down gracefully');
  httpServer.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n[Server] SIGINT received — shutting down');
  httpServer.close(() => process.exit(0));
});

export { httpServer, io };
