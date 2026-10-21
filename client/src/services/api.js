import axios from 'axios';

// Sessions live in an httpOnly cookie set by the server (not readable by page scripts, so XSS can't steal it).
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1', timeout: 20000, withCredentials: true });

// A 401 on a non-auth call means the session expired: let AuthContext sign the user out.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = err.config?.url ?? '';
    const isAuthCall = url.startsWith('/auth/login') || url.startsWith('/auth/register') || url.startsWith('/auth/me');
    if (err.response?.status === 401 && !isAuthCall) onUnauthorized();
    return Promise.reject(err);
  },
);

/** Pull a user-friendly message and per-field errors out of any axios error. */
export function parseError(err) {
  if (!err.response) return { message: 'Cannot reach the server. Check your connection and try again.', fields: {} };
  const d = err.response.data ?? {};
  const fields = {};
  (d.details ?? []).forEach((x) => { if (x.field && !fields[x.field]) fields[x.field] = x.message; });
  return { message: d.message ?? 'Something went wrong. Please try again.', fields, status: err.response.status };
}

/** Unwrap { success, data } helpers */
export const get = (url, params) => api.get(url, { params }).then((r) => r.data);
export const post = (url, body) => api.post(url, body).then((r) => r.data);
export const patch = (url, body) => api.patch(url, body).then((r) => r.data);
export const put = (url, body) => api.put(url, body).then((r) => r.data);
export const del = (url) => api.delete(url).then((r) => r.data);
