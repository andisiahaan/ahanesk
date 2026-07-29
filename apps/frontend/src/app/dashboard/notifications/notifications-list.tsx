'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Bell, Check, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import type { NotificationItem, NotificationCategory } from '@ahanesk/shared';
import { NOTIFICATION_CATEGORIES } from '@ahanesk/shared';

interface NotifPage { items: NotificationItem[]; meta: { total: number; hasNext: boolean } }

async function fetchNotifications(category?: string, isRead?: boolean): Promise<NotifPage> {
  const params = new URLSearchParams({ limit: '20' });
  if (category) params.set('category', category);
  if (isRead !== undefined) params.set('isRead', String(isRead));
  const res = await api.get<{ data: NotifPage }>(`/notifications?${params}`);
  const payload = res.data.data;
  if (payload?.items) {
    payload.items = payload.items.map((n: any) => ({
      ...n,
      isRead: n.isRead ?? n.is_read,
      createdAt: n.createdAt ?? n.created_at,
      readAt: n.readAt ?? n.read_at,
    }));
  }
  return payload;
}

const CATEGORY_ICONS: Record<string, string> = {
  account: '🔐', blog: '📝', news: '📰', ticket: '🎫', system: '⚙️', admin: '🛡️',
};

export function NotificationsList() {
  const t = useTranslations('notifications');
  const qc = useQueryClient();
  const [category, setCategory] = useState<NotificationCategory | undefined>(undefined);
  const [isRead, setIsRead]     = useState<boolean | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'list', category, isRead],
    queryFn:  () => fetchNotifications(category, isRead),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess:  () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess:  () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => { setCategory(undefined); setIsRead(undefined); }}
          className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${!category && isRead === undefined ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
        >All</button>
        <button
          onClick={() => setIsRead(false)}
          className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${isRead === false ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
        >Unread</button>
        {(NOTIFICATION_CATEGORIES as readonly string[]).filter(c => c !== 'admin').map((c) => (
          <button key={c}
            onClick={() => setCategory(c as NotificationCategory)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors capitalize ${category === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
          >{CATEGORY_ICONS[c]} {c}</button>
        ))}
      </div>

      {/* Mark all button */}
      <div className="flex justify-end mb-3">
        <button
          onClick={() => markAllMutation.mutate()}
          disabled={markAllMutation.isPending}
          className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
        >
          <Check className="w-3 h-3" /> {t('markAllRead')}
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array<undefined>(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : !data?.items || data.items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-muted-foreground gap-2">
          <Inbox className="w-10 h-10" />
          <p className="text-sm">{t('noNotifications')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {data?.items?.map((n) => (
            <li key={n.id}
              className={`flex gap-3 p-4 rounded-xl border border-border transition-colors ${!n.isRead ? 'bg-primary/5' : 'bg-card'}`}
            >
              <span className="text-xl mt-0.5">{CATEGORY_ICONS[n.category] ?? <Bell />}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{format(new Date(n.createdAt), 'dd MMM yyyy · HH:mm')}</p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => markOneMutation.mutate(n.id)}
                  className="flex-shrink-0 self-start mt-1 text-primary hover:text-primary/80"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
