'use client';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';

/** Hydrates user data on first mount. Must wrap app shell. */
export function AuthProvider({ children, isLoggedIn }: { children: React.ReactNode; isLoggedIn?: boolean }) {
  const hydrated = useRef(false);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (isLoggedIn) fetchMe();
  }, [isLoggedIn, fetchMe]);

  return <>{children}</>;
}
