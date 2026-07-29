'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@ahanesk/ui';
import { useAdminAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/',            icon: '◈', label: 'Dashboard' },
  { href: '/users',       icon: '⊕', label: 'Users' },
  { href: '/tickets',     icon: '◷', label: 'Tickets' },
  {
    href: '/blog', icon: '✎', label: 'Blog',
    sub: [
      { href: '/blog',           label: 'Posts' },
      { href: '/blog/categories',label: 'Categories' },
      { href: '/blog/tags',      label: 'Tags' },
    ]
  },
  { href: '/news',        icon: '⚐', label: 'News' },
  { href: '/pages',       icon: '≡', label: 'Pages' },
  { href: '/help',        icon: '♡', label: 'Help Center' },
  { href: '/api-keys',    icon: '⌗', label: 'API Keys' },
  { href: '/settings',    icon: '⊙', label: 'Settings' },
];

function SidebarContent({ onNav }: { onNav?: () => void }) {
  const pathname = usePathname();
  const logout   = useAdminAuthStore((s) => s.logout);

  return (
    <>
      <div className="flex items-center px-4 h-14 border-b border-sidebar-border shrink-0">
        <Logo frontendUrl={process.env.NEXT_PUBLIC_FRONTEND_URL} width={96} height={24} />
      </div>

      <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto p-2">
        {NAV.map((item) => {
          const isBlog = item.href === '/blog';
          const active = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

          if (item.sub) {
            return (
              <div key={item.href} className="flex flex-col gap-0.5">
                <div className={cn('flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors border-l-2', active ? 'border-primary bg-primary/10 text-primary' : 'border-transparent text-muted-foreground')}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{item.icon}</span>
                    {item.label}
                  </div>
                </div>
                <div className="flex flex-col ml-6 pl-2 border-l border-border gap-0.5 my-1">
                  {item.sub.map((sub) => (
                    <Link key={sub.href} href={sub.href} onClick={onNav}
                      className={cn('px-3 py-1.5 rounded-lg text-sm transition-colors', pathname === sub.href || (sub.href === '/blog' && pathname === '/blog/new') || (sub.href === '/blog/categories' && pathname.startsWith('/blog/categories')) || (sub.href === '/blog/tags' && pathname.startsWith('/blog/tags')) ? 'text-primary font-medium bg-primary/5' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <Link key={item.href} href={item.href} onClick={onNav}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border-l-2',
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
              )}>
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 shrink-0 border-t border-sidebar-border">
        <button
          onClick={() => logout().then(() => { window.location.href = '/auth/login'; })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <span>⊗</span> Sign Out
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-20 w-[var(--sidebar-w)] border-r border-sidebar-border bg-sidebar">
        <SidebarContent />
      </aside>

      <button
        className="md:hidden fixed top-3 left-4 z-50 flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card text-foreground"
        onClick={() => setOpen(!open)} aria-label="Toggle menu"
      >{open ? '✕' : '☰'}</button>

      {open && (
        <>
          <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="md:hidden flex flex-col fixed inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border bg-sidebar">
            <SidebarContent onNav={() => setOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}
