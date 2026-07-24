'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, Menu, X } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { AccountDropdown } from '@/components/account-dropdown';
import { NotificationBell } from '@/components/notification-bell';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@ahansk/ui';
import { cn } from '@/lib/cn';

interface DashboardShellProps {
  children: React.ReactNode;
  dashboardPath: string;
}

export function DashboardShell({ children, dashboardPath }: DashboardShellProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isDashboardRoot = pathname === dashboardPath;

  return (
    <div className="flex h-dvh bg-background overflow-hidden">
      {/* Sidebar — Desktop only */}
      <div className={cn("hidden lg:flex flex-shrink-0 transition-all duration-300", collapsed ? "w-[72px]" : "w-64")}>
        <DashboardSidebar 
          dashboardPath={dashboardPath} 
          collapsed={collapsed} 
          onToggleCollapse={() => setCollapsed(!collapsed)} 
        />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex h-14 w-full items-center justify-center border-b border-border bg-card flex-shrink-0 px-4 sm:px-6 lg:px-8">
          
          {/* Desktop Header: Constrained to max-w-5xl, aligning right/left items with main content */}
          <div className="hidden lg:flex items-center justify-between w-full max-w-5xl mx-auto h-full">
            <div className="flex items-center">
              <Link href={dashboardPath} className="flex items-center">
                <Logo height={26} />
              </Link>
            </div>
            
            <div className="flex items-center gap-1 -mr-2">
              <ThemeToggle />
              <NotificationBell dashboardPath={dashboardPath} />
              <AccountDropdown />
            </div>
          </div>

          {/* Mobile Header: Full width, Hamburger on left, Profile on right */}
          <div className="flex lg:hidden items-center justify-between w-full h-full">
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(true)}
                aria-label={t('openMenu')}
                className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors -ml-2"
              >
                <Menu className="size-5" />
              </button>
            </div>
            <div className="flex items-center gap-1 -mr-2">
              <ThemeToggle />
              <NotificationBell dashboardPath={dashboardPath} />
              <AccountDropdown />
            </div>
          </div>

        </header>

        {/* Mobile drawer overlay */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card lg:hidden shadow-2xl">
              <div className="flex h-full flex-col">
                <div className="flex h-14 items-center justify-between px-4 border-b border-border flex-shrink-0">
                  <Logo height={28} />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label={t('closeMenu')}
                    className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <DashboardSidebar dashboardPath={dashboardPath} onNav={() => setMobileMenuOpen(false)} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 pb-20 lg:pb-6">
          {children}
        </main>

        {/* Mobile bottom nav — Dashboard only */}
        <nav className="lg:hidden flex-shrink-0 border-t border-border bg-card px-2 pb-safe">
          <div className="flex items-center justify-around">
            <Link
              href={dashboardPath}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-3 text-[0.6rem] font-medium transition-colors min-w-[60px]',
                isDashboardRoot ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <span className={cn('transition-transform', isDashboardRoot && 'scale-110')}>
                <LayoutDashboard className="size-5" />
              </span>
              <span>{t('dashboard')}</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
