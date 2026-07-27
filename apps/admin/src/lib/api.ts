import axios from 'axios';

// ─── Centralized API client ────────────────────────────────────────────────────
// Auth is cookie-based (httpOnly). withCredentials ensures cookies are sent.
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:10311',
  withCredentials: true,
});

// ─── CSRF Interceptor ─────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method ?? '')) {
    const match = document.cookie.match(new RegExp('(^| )csrf_token=([^;]+)'));
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
    if (err.response?.status !== 401 || orig._retry) return Promise.reject(err);

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
