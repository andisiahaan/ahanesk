'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Plus, Copy, Check, Trash2, Clock, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { z } from 'zod';
import { CreatePatSchema, type CreatePatDto } from '@ahansk/shared';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PAT {
  id: string; name: string; token_prefix: string;
  last_used_at: string | null; expires_at: string | null;
  created_at: string; revoked_at: string | null;
}

export default function PersonalAccessTokensPage() {
  const [tokens, setTokens]       = useState<PAT[]>([]);
  const [loading, setLoading]     = useState(true);
  const [newToken, setNewToken]   = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);
  const [showForm, setShowForm]   = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.input<typeof CreatePatSchema>>({
    resolver: zodResolver(CreatePatSchema),
  });

  useEffect(() => {
    api.get('/personal-access-tokens')
      .then((res) => setTokens(res.data.data ?? []))
      .catch(() => toast.error('Failed to load tokens.'))
      .finally(() => setLoading(false));
  }, []);

  const onCreate = async (data: z.input<typeof CreatePatSchema>) => {
    try {
      const payload = { ...data, expires_at: data.expires_at === '' ? undefined : data.expires_at };
      const res = await api.post('/personal-access-tokens', payload);
      const created = res.data.data;
      setNewToken(created.token);
      setTokens((prev) => [created, ...prev]);
      reset(); setShowForm(false);
    } catch {
      toast.error('Failed to create token.');
    }
  };

  const onRevoke = async (id: string, name: string) => {
    if (!confirm(`Revoke token "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/personal-access-tokens/${id}`);
      setTokens((prev) => prev.filter((t) => t.id !== id));
      toast.success('Token revoked.');
    } catch {
      toast.error('Failed to revoke token.');
    }
  };

  const copyToken = () => {
    if (!newToken) return;
    navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const active = tokens.filter((t) => !t.revoked_at);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <KeyRound className="size-6" /> Personal Access Tokens
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tokens to authenticate API requests on your behalf.
          </p>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="size-4 mr-1.5" /> Generate Token
          </Button>
        )}
      </div>

      {/* New token reveal banner */}
      {newToken && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <AlertTriangle className="size-4 flex-shrink-0" />
            <p className="text-sm font-semibold">Save your token now — it won&apos;t be shown again.</p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-background border border-border px-4 py-2.5 text-xs font-mono text-foreground truncate">
              {newToken}
            </code>
            <button onClick={copyToken}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors flex-shrink-0">
              {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button onClick={() => setNewToken(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            I&apos;ve saved it — dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit(onCreate)} className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">New Token</h2>
          <div className="flex flex-col gap-1.5">
            <Label>Token Name <span className="text-destructive">*</span></Label>
            <Input placeholder="e.g. My App, CI/CD Pipeline" autoFocus {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Expiry <span className="text-muted-foreground text-xs">(optional — leave blank for no expiry)</span></Label>
            <Input type="datetime-local" {...register('expires_at')} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => { setShowForm(false); reset(); }}>Cancel</Button>
            <Button type="submit" size="sm" loading={isSubmitting}>Generate</Button>
          </div>
        </form>
      )}

      {/* Token list */}
      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading…</div>
      ) : active.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <KeyRound className="size-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm font-semibold text-foreground mb-1">No tokens yet</p>
          <p className="text-sm text-muted-foreground">Generate a token to access the API programmatically.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {active.map((token) => (
            <div key={token.id} className="flex items-center gap-4 px-5 py-4">
              <div className="size-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <KeyRound className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{token.name}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{token.token_prefix}••••••••••••</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    Created {new Date(token.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {token.last_used_at && (
                    <span>· Last used {new Date(token.last_used_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  )}
                  {token.expires_at && (
                    <span className="text-amber-600">· Expires {new Date(token.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  )}
                </div>
              </div>
              <button onClick={() => onRevoke(token.id, token.name)}
                className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0">
                <Trash2 className="size-3.5" /> Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
