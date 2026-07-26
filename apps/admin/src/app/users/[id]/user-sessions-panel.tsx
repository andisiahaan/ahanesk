'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Monitor, Globe, Trash2, ShieldOff } from 'lucide-react';

interface Session { id: string; user_agent: string | null; ip_address: string | null; created_at: string; expires_at: string | null }
interface Activity { id: string; type: string; ip_address: string | null; success: boolean; created_at: string }

export function UserSessionsPanel({ userId }: { userId: string }) {
  const [sessions, setSessions]   = useState<Session[]>([]);
  const [activity, setActivity]   = useState<Activity[]>([]);
  const [revoking, setRevoking]   = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [tab, setTab]             = useState<'sessions' | 'activity'>('sessions');

  const load = useCallback(async () => {
    const [s, a] = await Promise.allSettled([
      api.get(`/users/${userId}/sessions`),
      api.get(`/users/${userId}/activity`),
    ]);
    if (s.status === 'fulfilled') setSessions(s.value.data.data ?? []);
    if (a.status === 'fulfilled') setActivity(a.value.data.data ?? []);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const revoke = async (tokenId: string) => {
    setRevoking(tokenId);
    try {
      await api.delete(`/users/${userId}/sessions/${tokenId}`);
      setSessions((prev) => prev.filter((s) => s.id !== tokenId));
      toast.success('Session revoked.');
    } catch { toast.error('Failed to revoke session.'); }
    finally { setRevoking(null); }
  };

  const revokeAll = async () => {
    if (!confirm('Revoke ALL active sessions for this user? They will be logged out immediately.')) return;
    setRevokingAll(true);
    try {
      await api.delete(`/users/${userId}/sessions`);
      setSessions([]);
      toast.success('All sessions revoked.');
    } catch { toast.error('Failed to revoke sessions.'); }
    finally { setRevokingAll(false); }
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden col-span-full">
      <div className="flex items-center justify-between px-5 py-3 bg-muted border-b border-border">
        <div className="flex gap-1">
          {(['sessions', 'activity'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t === 'sessions' ? `Active Sessions (${sessions.length})` : `Login Activity (${activity.length})`}
            </button>
          ))}
        </div>
        {tab === 'sessions' && sessions.length > 0 && (
          <Button variant="destructive" size="sm" loading={revokingAll} onClick={revokeAll}>
            <ShieldOff className="size-3.5 mr-1" /> Revoke All
          </Button>
        )}
      </div>

      {tab === 'sessions' && (
        sessions.length === 0
          ? <p className="px-5 py-6 text-sm text-muted-foreground text-center">No active sessions.</p>
          : <table className="w-full text-sm border-collapse">
              <thead className="bg-muted/50">
                <tr>{['Device', 'IP', 'Created', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <Monitor className="size-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">{s.user_agent ? s.user_agent.slice(0, 40) + '…' : 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Globe className="size-3.5" /> {s.ip_address ?? '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => revoke(s.id)} disabled={revoking === s.id}
                        className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors">
                        <Trash2 className="size-3.5" /> {revoking === s.id ? '…' : 'Revoke'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
      )}

      {tab === 'activity' && (
        activity.length === 0
          ? <p className="px-5 py-6 text-sm text-muted-foreground text-center">No activity recorded.</p>
          : <table className="w-full text-sm border-collapse">
              <thead className="bg-muted/50">
                <tr>{['Event', 'IP', 'Result', 'Time'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {activity.map((a) => (
                  <tr key={a.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-medium text-foreground">{a.type}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{a.ip_address ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${a.success ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                        {a.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
      )}
    </div>
  );
}
