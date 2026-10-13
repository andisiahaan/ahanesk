'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DEFAULT_AUTH_SETTINGS, type AuthSettings } from '@ahanesk/shared';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface SettingsEntity {
  key: string;
  settings: AuthSettings;
}

export function useAuthSettings() {
  return useQuery<AuthSettings>({
    queryKey: ['settings', 'auth'],
    queryFn: async (): Promise<AuthSettings> => {
      try {
        const { data: res } = await api.get<ApiResponse<SettingsEntity>>('/settings/auth');
        return res.data?.settings ?? DEFAULT_AUTH_SETTINGS;
      } catch {
        return DEFAULT_AUTH_SETTINGS;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    initialData: DEFAULT_AUTH_SETTINGS,
  });
}
