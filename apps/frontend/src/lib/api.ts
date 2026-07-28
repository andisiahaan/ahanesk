import axios from 'axios';

// ─── Centralized API client ────────────────────────────────────────────────────
// All auth is cookie-based (httpOnly). No manual token management needed here.
// withCredentials ensures cookies are sent on every request automatically.
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
let waitQueue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config as typeof err.config & { _retry?: boolean };
    if (err.response?.status !== 401 || original._retry) return Promise.reject(err);

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waitQueue.push(() => resolve(api(original)));
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      await api.post('/auth/refresh');
      waitQueue.forEach((cb) => cb());
      waitQueue = [];
      return api(original);
    } catch {
      waitQueue = [];
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;

// ─── Server Component Fetch Utility ─────────────────────────────────────────────
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  let cookieString = '';
  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    cookieString = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:10311'}${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(cookieString ? { cookie: cookieString } : {}),
    },
  });
}

// ─── Storage Image URL Helper ────────────────────────────────────────────────
export function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('data:')) return path;
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:10311';
  // Ensure we don't double slash if path starts with slash
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // If the path already has 'storage/' prefix, just append it
  if (cleanPath.startsWith('storage/')) {
    return `${baseUrl}/${cleanPath}`;
  }
  
  return `${baseUrl}/storage/${cleanPath}`;
}
