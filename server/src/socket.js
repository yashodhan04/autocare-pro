import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { COOKIE_NAME } from './middleware/auth.js';
import { config } from './config/env.js';

let io = null;

/** Attach Socket.IO. Clients authenticate with their JWT and join a private `user:<id>` room. */
export function initSocket(httpServer) {
  io = new SocketIOServer(httpServer, { cors: { origin: config.clientUrls, methods: ['GET', 'POST'], credentials: true } });

  io.use((socket, next) => {
    try {
      const payload = jwt.verify(socket.handshake.auth?.token || cookie.parse(socket.handshake.headers.cookie ?? '')[COOKIE_NAME] || '', config.jwtSecret);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.data.userId}`);
    socket.join(`role:${socket.data.role}`);
  });
  return io;
}

export const emitToUser = (userId, event, payload) => io?.to(`user:${userId}`).emit(event, payload);
export const emitToRole = (role, event, payload) => io?.to(`role:${role}`).emit(event, payload);
export const emitAll = (event, payload) => io?.emit(event, payload);
