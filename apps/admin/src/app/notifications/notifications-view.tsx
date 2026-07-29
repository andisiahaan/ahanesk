'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { Send } from 'lucide-react';
import api from '@/lib/api';
import { NOTIFICATION_TYPE_REGISTRY, type NotificationType } from '@ahanesk/shared';

interface AdminNotif { id: string; type: string; category: string; title: string; message: string; is_read: boolean; created_at: string; user: { id: string; name: string; email: string } }
interface AdminNotifPage { items: AdminNotif[]; meta: { total: number } }
interface BroadcastDto { type: NotificationType; title: string; message: string; target: 'all' | 'admins' }

async function fetchAll(page: number): Promise<AdminNotifPage> {
  const res = await api.get<AdminNotifPage>(`/admin/notifications?page=${page}&limit=20`);
  return res.data;
}

async function broadcast(dto: BroadcastDto): Promise<void> {
  await api.post('/admin/notifications/broadcast', dto);
}

const NOTIFICATION_TYPES = Object.keys(NOTIFICATION_TYPE_REGISTRY) as NotificationType[];

export function AdminNotificationsView() {
  const t = useTranslations('notifications');
  const [page, setPage]       = useState(1);
  const [type, setType]       = useState<NotificationType>(NOTIFICATION_TYPES[0]);
  const [title, setTitle]     = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget]   = useState<'all' | 'admins'>('all');

  const { data, isLoading, refetch } = useQuery({ queryKey: ['admin-notifications', page], queryFn: () => fetchAll(page) });

  const broadcastMutation = useMutation({
    mutationFn: broadcast,
    onSuccess:  () => { setTitle(''); setMessage(''); void refetch(); },
  });

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    broadcastMutation.mutate({ type, title, message, target });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Broadcast Form */}
      <div className="lg:col-span-1">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">{t('broadcast.title')}</h2>
          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('broadcast.typeLabel')}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as NotificationType)}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {NOTIFICATION_TYPES.filter(tp => !NOTIFICATION_TYPE_REGISTRY[tp].adminOnly).map((tp) => (
                  <option key={tp} value={tp}>{tp}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('broadcast.targetLabel')}</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as 'all' | 'admins')}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">{t('broadcast.targetAll')}</option>
                <option value="admins">{t('broadcast.targetAdmins')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('broadcast.titleLabel')}</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={255}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('broadcast.messageLabel')}</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={1000} rows={4}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
            <button type="submit" disabled={broadcastMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
              {broadcastMutation.isPending ? '...' : t('broadcast.submit')}
            </button>
            {broadcastMutation.isSuccess && <p className="text-xs text-primary text-center">{t('broadcast.success')}</p>}
          </form>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="lg:col-span-2">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{t('allNotifications')}</span>
            <span className="text-xs text-muted-foreground">{data?.meta.total ?? 0} total</span>
          </div>
          {isLoading ? (
            <div className="space-y-px">
              {[...Array<undefined>(5)].map((_, i) => <div key={i} className="h-14 bg-muted animate-pulse" />)}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {['User', 'Type', 'Title', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.items.map((n) => (
                  <tr key={n.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-foreground">{n.user.name}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-muted text-xs font-mono text-muted-foreground">{n.type}</span></td>
                    <td className="px-4 py-3 text-foreground max-w-[160px] truncate">{n.title}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{format(new Date(n.created_at), 'dd MMM yy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {(data?.meta.total ?? 0) > 20 && (
            <div className="flex justify-between items-center px-5 py-3 border-t border-border">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-xs text-primary disabled:opacity-40">Prev</button>
              <span className="text-xs text-muted-foreground">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={(data?.items.length ?? 0) < 20} className="text-xs text-primary disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
