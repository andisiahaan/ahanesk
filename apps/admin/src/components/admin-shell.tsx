'use client';
import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { useAdminAuthStore } from '@/stores/auth.store';
import { AccountDropdown } from '@/components/account-dropdown';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useState } from 'react';

const PUBLIC_PATHS = ['/auth'];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (isPublic) return <>{children}</>;
  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, fetchMe, logout } = useAdminAuthStore();
  const hydrated = useRef(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    // Verify session via API — middleware already blocked unauthenticated requests,
    // this is a secondary check to populate user state and verify ADMIN role.
    fetchMe().then(() => {
      if (!useAdminAuthStore.getState().user) setError(true);
    });
  }, [fetchMe, router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground text-sm mb-6 max-w-sm">
          You are currently signed in, but you do not have administrator privileges or your session has expired.
        </p>
        <button
          onClick={() => {
            logout().then(() => window.location.href = '/auth/login');
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Sign out & Switch Account
        </button>
      </div>
    );
  }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="text-sm text-muted-foreground animate-pulse">Loading…</span>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 md:ml-[var(--sidebar-w)]">
        <header className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 h-14 border-b border-border bg-card">
          <span className="font-semibold text-sm text-foreground ml-12 md:ml-0">Admin Panel</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AccountDropdown />
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
