'use client';
import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';

import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserSessionsPanel } from './user-sessions-panel';
import { Trash2 } from 'lucide-react';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  email_verified_at: string | null;
  created_at: string;
  bans: Array<{
    id: string;
    reason: string;
    banned_by: string;
    expires_at: string | null;
    unbanned_at: string | null;
    created_at: string;
  }>;
}

import { useTranslations } from 'next-intl';

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations('users');
  
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('USER');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPassword, setEditPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [banReason, setBanReason] = useState('');
  const [banExpiresAt, setBanExpiresAt] = useState('');
  const [isBanning, setIsBanning] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get(`/users/${id}`);
      const u = data.data;
      setUser(u);
      setEditName(u.name);
      setEditEmail(u.email);
      setEditRole(u.role);
      setEditIsActive(u.is_active);
    } catch {
      toast.error(t('messages.userNotFound'));
      router.push('/users');
    } finally {
      setLoading(false);
    }
  }, [id, router, t]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const payload: Record<string, unknown> = {
        name: editName,
        email: editEmail,
        role: editRole,
        is_active: editIsActive,
      };
      if (editPassword) payload['password'] = editPassword;
      await api.patch(`/users/${id}`, payload);
      toast.success(t('messages.updated') || 'User updated successfully');
      setEditPassword('');
      await fetchUser();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('messages.updateFailed'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banReason.trim()) return;
    setIsBanning(true);
    try {
      await api.post(`/users/${id}/ban`, {
        reason: banReason,
        expires_at: banExpiresAt ? new Date(banExpiresAt).toISOString() : null,
      });
      toast.success(t('messages.banSuccess'));
      setBanReason('');
      setBanExpiresAt('');
      await fetchUser();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('messages.banFailed'));

    } finally {
      setIsBanning(false);
    }
  };

  const handleUnban = async () => {
    if (!confirm(t('details.confirmLift'))) return;
    try {
      await api.post(`/users/${id}/unban`);
      toast.success(t('messages.unbanSuccess'));
      await fetchUser();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('messages.unbanFailed'));
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Permanently delete user "${user?.name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted.');
      router.push('/users');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete user.');
    }
  };

  if (loading) return <div className="animate-pulse text-muted-foreground">Loading user details...</div>;
  if (!user) return null;

  // Ideally, the backend includes bans in the user fetch. Let's check if there's any active ban.
  const activeBan = user.bans?.find((b) => !b.unbanned_at && (!b.expires_at || new Date(b.expires_at) > new Date()));

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/users')}>
            ← {t('details.back')}
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{t('details.title')}</h1>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="size-4 mr-1.5" /> Delete Account
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t('details.profile')}</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">{t('fields.name') || 'Name'}</Label>
              <Input id="name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">{t('fields.email') || 'Email'}</Label>
              <Input id="email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="role">{t('fields.role') || 'Role'}</Label>
                <select id="role" value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="USER">{t('roles.USER')}</option>
                  <option value="ADMIN">{t('roles.ADMIN')}</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="status">{t('fields.status') || 'Status'}</Label>
                <select id="status" value={editIsActive ? 'true' : 'false'} onChange={(e) => setEditIsActive(e.target.value === 'true')} className="w-full h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="true">{t('status.active')}</option>
                  <option value="false">{t('status.inactive')}</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">{t('fields.password') || 'New Password'}</Label>
              <Input id="password" type="password" placeholder="Leave blank to keep current password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
            </div>
            <div className="text-xs text-muted-foreground pt-2">
              <p>{t('fields.id')}: {user.id}</p>
              <p>{t('fields.joined')}: {new Date(user.created_at).toLocaleDateString()}</p>
              <p>{t('fields.verified')}: {user.email_verified_at ? t('status.yes') : t('status.no')}</p>
            </div>
            <Button type="submit" disabled={isUpdating} className="w-full">
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </div>

        <div className="border border-destructive/20 bg-destructive/5 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-destructive">{t('details.banManagement')}</h2>
          
          {activeBan ? (
            <div className="space-y-4">
              <div className="p-3 bg-destructive/10 rounded-lg text-sm text-destructive border border-destructive/20">
                <p><strong>{t('fields.status')}:</strong> {t('details.banned')}</p>
                <p><strong>{t('details.reason')}:</strong> {activeBan.reason}</p>
                <p><strong>{t('details.expires')}:</strong> {activeBan.expires_at ? new Date(activeBan.expires_at).toLocaleString() : t('details.permanent')}</p>
              </div>
              <Button variant="outline" onClick={handleUnban} className="w-full">{t('details.liftBan')}</Button>
            </div>
          ) : (
            <form onSubmit={handleBan} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="reason">{t('details.banReason')}</Label>
                <Input
                  id="reason"
                  placeholder={t('details.banReasonPlaceholder')}
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="expires">{t('details.banExpires')}</Label>
                <Input
                  id="expires"
                  type="datetime-local"
                  value={banExpiresAt}
                  onChange={(e) => setBanExpiresAt(e.target.value)}
                />
              </div>
              <Button type="submit" variant="destructive" className="w-full" disabled={isBanning}>
                {isBanning ? t('details.banning') : t('details.banUser')}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Sessions & Activity */}
      <div className="grid grid-cols-1">
        <UserSessionsPanel userId={id} />
      </div>
    </div>
  );
}
