/**
 * server.js — HTTP server entry point
 * Connects MySQL (Sequelize), starts Express and attaches authenticated Socket.IO.
 */

import { createServer } from 'http';
import app from './app.js';
import { config } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocket } from './socket.js';

const httpServer = createServer(app);
const io = initSocket(httpServer);

try {
  await connectDB();
  console.log(`[DB] MySQL connected (${config.databaseUrl.replace(/\/\/[^@]*@/, '//***@')})`);
} catch (err) {
  console.error('[DB] MySQL connection failed:', err.message);
  process.exit(1);
}

httpServer.listen(config.port, () => {
  console.log(`[Server] AutoCare Pro API listening on :${config.port} (${config.nodeEnv})`);
  console.log(`[Server] Health: http://localhost:${config.port}/api/v1/health`);
});

const shutdown = (sig) => {
  console.log(`[Server] ${sig} received — shutting down`);
  io.close();
  httpServer.close(async () => { await disconnectDB(); process.exit(0); });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { httpServer, io };
