import { create } from 'zustand';
import api from '@/lib/api';

interface AdminUser { id: number; name: string; email: string; role: string; }

interface AdminAuthState {
  user: AdminUser | null;
  setUser: (user: AdminUser | null) => void;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

// No token in store — auth is fully cookie-based (httpOnly cookies set by server)
export const useAdminAuthStore = create<AdminAuthState>()((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  logout: async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    set({ user: null });
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/users/me');
      if (data.data.role !== 'ADMIN') throw new Error('Not admin');
      set({ user: data.data });
    } catch {
      set({ user: null });
    }
  },
}));
