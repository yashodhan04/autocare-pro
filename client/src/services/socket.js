import { io } from 'socket.io-client';

let socket = null;

/** Authenticated realtime connection (notifications) — authenticates with the session cookie. */
export function connectSocket() {
  if (socket) return socket;
  socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, { withCredentials: true, transports: ['websocket', 'polling'] });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
