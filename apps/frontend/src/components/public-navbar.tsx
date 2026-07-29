'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Logo } from '@ahanesk/ui';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

const NAV_LINKS = [
  { key: 'features', href: '/#features' },
  { key: 'pricing', href: '/#pricing' },
  { key: 'blog',  href: '/blog' },
  { key: 'about', href: '/pages/about' },
  { key: 'contact', href: '/pages/contact' },
] as const;

export function PublicNavbar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [open, setOpen] = useState(false);

  const dashboardPath = process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Logo height={32} />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'text-foreground bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                )}
              >
                {t(key)}
              </Link>
            ))}
          </nav>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <Link href={dashboardPath}>
                <Button size="sm" className="rounded-full font-semibold">
                  {t('dashboard')}
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {t('signIn')}
                </Link>
                <Link href="/register">
                  <Button size="sm" className="rounded-full font-semibold shadow-md">
                    {t('getStarted')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile: theme + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setOpen(!open)}
              aria-label={open ? t('closeMenu') : t('openMenu')}
              className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-4 pt-3 space-y-1">
          {NAV_LINKS.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'text-foreground bg-muted'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
              )}
            >
              {t(key)}
            </Link>
          ))}
          <div className="pt-2 border-t border-border flex flex-col gap-2">
            {isAuthenticated ? (
              <Link href={dashboardPath} onClick={() => setOpen(false)}>
                <Button className="w-full rounded-full font-semibold">{t('dashboard')}</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full rounded-full">{t('signIn')}</Button>
                </Link>
                <Link href="/register" onClick={() => setOpen(false)}>
                  <Button className="w-full rounded-full font-semibold">{t('getStarted')}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
