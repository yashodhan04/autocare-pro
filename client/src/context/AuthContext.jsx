import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { get, post, patch, setUnauthorizedHandler } from '../services/api.js';
import { connectSocket, disconnectSocket } from '../services/socket.js';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, customer: null, loading: true });

  const clear = useCallback(() => {
    disconnectSocket();
    setState({ user: null, customer: null, loading: false });
  }, []);

  const load = useCallback(async () => {
    try {
      const { data } = await get('/auth/me');
      setState({ user: data.user, customer: data.customer, loading: false });
      connectSocket();
    } catch {
      clear();
    }
  }, [clear]);

  useEffect(() => {
    setUnauthorizedHandler(clear);
    load(); // resolves the session from the cookie, if any
  }, [load, clear]);

  const startSession = useCallback(async ({ data }) => {
    await load();
    return data.user;
  }, [load]);

  const value = useMemo(() => ({
    ...state,
    isAuthenticated: Boolean(state.user),
    role: state.user?.role,
    login: async (email, password) => startSession(await post('/auth/login', { email, password })),
    register: async (form) => startSession(await post('/auth/register', form)),
    logout: async () => { try { await post('/auth/logout'); } catch { /* session may already be invalid */ } clear(); },
    updateProfile: async (body) => { const r = await patch('/auth/me', body); await load(); return r; },
    refresh: load,
    hasRole: (...roles) => roles.flat().includes(state.user?.role),
  }), [state, startSession, clear, load]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
