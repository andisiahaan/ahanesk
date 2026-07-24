'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Bell, X } from 'lucide-react';
import api from '@/lib/api';
import type { NotificationItem } from '@ahansk/shared';

interface UnreadCountResponse { count: number }
interface NotifListResponse   { items: NotificationItem[] }

async function fetchUnreadCount(): Promise<number> {
  const res = await api.get<{ data: UnreadCountResponse }>('/notifications/unread-count');
  return res.data.data.count;
}

async function fetchRecent(): Promise<NotificationItem[]> {
  const res = await api.get<{ data: NotifListResponse }>('/notifications?limit=5');
  return res.data.data.items;
}

async function markAllRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

interface NotificationBellProps {
  dashboardPath: string;
}

export function NotificationBell({ dashboardPath }: NotificationBellProps) {
  const t   = useTranslations('notifications');
  const [open, setOpen] = useState(false);
  const ref  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: count = 0, refetch: refetchCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn:  fetchUnreadCount,
    refetchInterval: 30_000,
  });

  const { data: recent = [], refetch: refetchRecent } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn:  fetchRecent,
    refetchInterval: 30_000,
  });

  const handleMarkAll = async () => {
    await markAllRead();
    void refetchCount();
    void refetchRecent();
  };

  return (
    <div ref={ref} className="relative">
      <button
        id="notification-bell-btn"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
              <span className="text-lg font-semibold text-foreground">Notifications</span>
              <div className="flex items-center gap-4">
                {count > 0 && (
                  <button onClick={handleMarkAll} className="text-sm text-primary hover:underline">
                    {t('markAllRead')}
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <ul className="divide-y divide-border flex-1 overflow-y-auto">
              {recent.length === 0 && (
                <li className="px-4 py-8 text-sm text-muted-foreground text-center">{t('noNotifications')}</li>
              )}
              {recent.map((n) => (
                <li key={n.id} className={`px-4 sm:px-6 py-4 hover:bg-muted/50 transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}>
                  <Link href={(n.data?.url as string) ?? `${dashboardPath}/notifications`} className="block" onClick={() => setOpen(false)}>
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="px-4 sm:px-6 py-4 border-t border-border bg-muted/10">
              <Link href={`${dashboardPath}/notifications`} onClick={() => setOpen(false)}
                className="text-sm text-primary hover:underline block text-center font-medium">
                View all notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
