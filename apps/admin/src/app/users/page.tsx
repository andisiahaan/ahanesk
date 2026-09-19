'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

interface User {
  id: number; name: string; email: string; role: string;
  is_active: boolean; email_verified_at: string | null;
}

function Badge({ children, variant }: { children: React.ReactNode; variant: 'green' | 'red' | 'blue' | 'gray' }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-bold tracking-wide',
      variant === 'green' && 'bg-success/12 text-success',
      variant === 'red'   && 'bg-destructive/12 text-destructive',
      variant === 'blue'  && 'bg-primary/12 text-primary',
      variant === 'gray'  && 'bg-muted text-muted-foreground',
    )}>{children}</span>
  );
}

export default function UsersPage() {
  const t = useTranslations('users');
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get<{ data: { items?: User[] } | User[] }>('/users');
      const payload = res.data.data;
      if (Array.isArray(payload)) {
        setUsers(payload);
      } else {
        setUsers(payload?.items ?? []);
      }
    } catch { toast.error(t('messages.loadFailed')); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleActive = async (id: number, is_active: boolean) => {
    try {
      await api.patch(`/users/${id}`, { is_active: !is_active });
      setUsers((p) => p.map((u) => u.id === id ? { ...u, is_active: !is_active } : u));
      toast.success(is_active ? t('messages.disabled') : t('messages.enabled'));
    } catch { toast.error(t('messages.updateFailed')); }
  };

  const deleteUser = async (id: number) => {
    if (!confirm(t('details.confirmDelete'))) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers((p) => p.filter((u) => u.id !== id));
      toast.success(t('messages.deleted'));
    } catch { toast.error(t('messages.deleteFailed')); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('list.title')}</h1>
        <span className="text-sm text-muted-foreground">{users.length} {t('list.total')}</span>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full border-collapse min-w-[560px]">
            <thead className="bg-muted">
              <tr>
                {[t('fields.name'), t('fields.email'), t('fields.role'), t('fields.status'), t('fields.verified'), t('fields.actions')].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3"><Badge variant={u.role === 'ADMIN' ? 'blue' : 'gray'}>{t(`roles.${u.role as 'ADMIN' | 'USER'}`)}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={u.is_active ? 'green' : 'red'}>{u.is_active ? t('status.active') : t('status.inactive')}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={u.email_verified_at ? 'green' : 'gray'}>{u.email_verified_at ? t('status.yes') : t('status.no')}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/users/${u.id}`)}>
                        {t('actions.view')}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(u.id, u.is_active)}>
                        {u.is_active ? t('actions.disable') : t('actions.enable')}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteUser(u.id)}>{t('actions.delete')}</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
