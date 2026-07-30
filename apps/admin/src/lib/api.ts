import axios from 'axios';

// ─── Centralized API client ────────────────────────────────────────────────────
// Auth is cookie-based (httpOnly). withCredentials ensures cookies are sent.
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:10311',
  withCredentials: true,
});

// ─── CSRF Interceptor ─────────────────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method ?? '')) {
    let match = document.cookie.match(new RegExp('(^| )csrf_token=([^;]+)'));
    if (!match) {
      try {
        const baseURL = config.baseURL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:10311';
        await axios.get(`${baseURL.replace(/\/$/, '')}/`, { withCredentials: true });
        match = document.cookie.match(new RegExp('(^| )csrf_token=([^;]+)'));
      } catch (e) {
        // ignore
      }
    }
    if (match) {
      config.headers['X-CSRF-Token'] = match[2];
    }
  }
  return config;
});

// ─── Response: auto-refresh on 401 ────────────────────────────────────────────
let isRefreshing = false;
let queue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const orig = err.config as typeof err.config & { _retry?: boolean };
    // Skip auto-refresh for auth endpoints — let the error propagate to the caller
    const skipRefreshUrls = ['/auth/login', '/auth/register', '/auth/refresh'];
    const isAuthEndpoint = skipRefreshUrls.some((u) => orig.url?.includes(u));
    if (err.response?.status !== 401 || orig._retry || isAuthEndpoint) return Promise.reject(err);

    if (isRefreshing) {
      return new Promise((resolve) => queue.push(() => resolve(api(orig))));
    }

    orig._retry = true;
    isRefreshing = true;
    try {
      await api.post('/auth/refresh');
      queue.forEach((cb) => cb());
      queue = [];
      return api(orig);
    } catch {
      queue = [];
      if (typeof window !== 'undefined') window.location.href = '/auth/login';
      return Promise.reject(err);
    } finally { isRefreshing = false; }
  },
);

export default api;
