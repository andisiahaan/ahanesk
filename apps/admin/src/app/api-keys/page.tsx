'use client';
import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { KeyRound, Trash2, Clock, User as UserIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';

interface PAT {
  id: string;
  name: string;
  token_prefix: string;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function ApiKeysPage() {
  const t = useTranslations('api-keys');
  const [tokens, setTokens] = useState<PAT[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/personal-access-tokens', { params: { page: p, limit } });
      setTokens(data.data?.items ?? []);
      setMeta(data.data?.meta ?? null);
    } catch {
      toast.error(t('messages.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t, limit]);

  useEffect(() => {
    load(page);
  }, [load, page]);

  const revoke = async (id: string) => {
    if (!confirm(t('actions.confirmRevoke'))) return;
    try {
      await api.delete(`/admin/personal-access-tokens/${id}`);
      setTokens((p) => p.filter((token) => token.id !== id));
      toast.success(t('messages.revoked'));
      if (meta) setMeta({ ...meta, total: meta.total - 1 });
    } catch {
      toast.error(t('messages.revokeFailed'));
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <KeyRound className="size-6" /> {t('title')}
        </h1>
        {meta && (
          <span className="text-sm text-muted-foreground">{meta.total} {t('total')}</span>
        )}
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead className="bg-muted">
              <tr>
                {[
                  t('fields.owner'),
                  t('fields.name'),
                  t('fields.prefix'),
                  t('fields.lastUsed'),
                  t('fields.expires'),
                  t('fields.actions')
                ].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground animate-pulse">
                    Loading…
                  </td>
                </tr>
              ) : tokens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center">
                    <p className="text-sm text-muted-foreground">{t('messages.empty')}</p>
                  </td>
                </tr>
              ) : (
                tokens.map((token) => (
                  <tr key={token.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <UserIcon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate max-w-[150px] sm:max-w-[200px]">{token.user.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-[200px]">{token.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-foreground truncate max-w-[150px]">
                      {token.name}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {token.token_prefix}••••••••
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {token.last_used_at ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3" />
                          {new Date(token.last_used_at).toLocaleDateString()}
                        </div>
                      ) : (
                        t('status.never')
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {token.expires_at ? new Date(token.expires_at).toLocaleDateString() : t('status.noExpiry')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="destructive" size="sm" onClick={() => revoke(token.id)} className="w-full sm:w-auto h-8 text-xs">
                        <Trash2 className="size-3.5 mr-1.5" />
                        {t('actions.revoke')}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
            <span className="text-xs text-muted-foreground">
              Page {meta.page} of {meta.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={!meta.hasPrev}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={!meta.hasNext}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
