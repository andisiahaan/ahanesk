'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';

export function BlogNavbarActions() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const dashboardPath = process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard';

  return (
    <div className="flex items-center gap-3 ml-auto">
      <ThemeToggle />
      {isAuthenticated ? (
        <Link href={dashboardPath} className="hidden sm:inline-block">
          <Button size="sm" className="rounded-full font-semibold">
            Dashboard
          </Button>
        </Link>
      ) : (
        <>
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block">
            Sign In
          </Link>
          <Link href="/register">
            <Button size="sm" className="rounded-full font-semibold shadow-md">
              Get Started
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}
