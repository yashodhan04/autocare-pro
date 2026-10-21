import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { get, patch, post } from '../services/api.js';
import { connectSocket } from '../services/socket.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const Ctx = createContext(null);

/** Loads the latest notifications and listens for live ones over Socket.IO. */
export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const r = await get('/notifications', { limit: 15 });
      setItems(r.data);
      setUnread(r.pagination.unread);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { setItems([]); setUnread(0); return undefined; }
    load();
    const socket = connectSocket();
    const onNotif = (n) => {
      setItems((prev) => [n, ...prev].slice(0, 15));
      setUnread((u) => u + 1);
      toast?.info(n.title, n.message);
    };
    socket?.on('notification', onNotif);
    return () => socket?.off('notification', onNotif);
  }, [isAuthenticated, load, toast]);

  const markRead = useCallback(async (id) => {
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(u - 1, 0));
    try { await patch(`/notifications/${id}/read`); } catch { load(); }
  }, [load]);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try { await post('/notifications/read-all'); } catch { load(); }
  }, [load]);

  const value = useMemo(() => ({ items, unread, reload: load, markRead, markAllRead }), [items, unread, load, markRead, markAllRead]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useNotifications = () => useContext(Ctx);
