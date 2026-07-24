'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, Newspaper, ChevronRight, PanelLeftClose, PanelLeft
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface NavItem {
  key: string;
  href: string;
  icon: React.ReactNode;
  children?: { key: string; href: string }[];
}

const useNavItems = (base: string): NavItem[] => [
  { key: 'dashboard', href: base,              icon: <LayoutDashboard className="size-4" /> },
  { key: 'news',      href: `${base}/news`,    icon: <Newspaper className="size-4" /> },
];

interface DashboardSidebarProps {
  dashboardPath: string;
  onNav?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DashboardSidebar({ dashboardPath, onNav, collapsed = false, onToggleCollapse }: DashboardSidebarProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const navItems = useNavItems(dashboardPath);

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="flex h-full flex-col border-r border-border bg-card w-full">
      {/* Header */}
      <div className="hidden lg:flex h-14 items-center justify-between px-4 border-b border-border flex-shrink-0">
        {!collapsed && (
          <Link href={dashboardPath} onClick={onNav} className="font-bold text-foreground text-lg tracking-tight truncate">
            Dashboard
          </Link>
        )}
        {onToggleCollapse && (
          <button 
            onClick={onToggleCollapse}
            className={cn("inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors", collapsed && "mx-auto")}
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href, item.href === dashboardPath);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.key}>
              <Link
                href={item.href}
                onClick={onNav}
                className={cn(
                  'flex items-center rounded-lg py-2.5 text-sm font-medium transition-all group',
                  collapsed ? 'justify-center px-0' : 'gap-2.5 px-3',
                  active
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent',
                )}
                title={collapsed ? t(item.key) : undefined}
              >
                {item.icon}
                {!collapsed && <span className="flex-1">{t(item.key)}</span>}
                {!collapsed && hasChildren && <ChevronRight className="size-3.5 opacity-50" />}
              </Link>

              {/* Sub-items */}
              {!collapsed && hasChildren && isActive(item.href) && (
                <div className="ml-4 mt-0.5 pl-3 border-l border-border space-y-0.5">
                  {item.children!.map((child) => (
                    <Link
                      key={child.key}
                      href={child.href}
                      onClick={onNav}
                      className={cn(
                        'block rounded-md px-3 py-2 text-xs font-medium transition-colors',
                        pathname === child.href
                          ? 'text-primary bg-primary/5'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                      )}
                    >
                      {t(child.key)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
