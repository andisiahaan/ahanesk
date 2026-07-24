import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Newspaper, ArrowRight, Calendar } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export const metadata = { title: 'News' };

interface NewsItem {
  id:           string;
  title:        string;
  slug:         string;
  type:         string;
  published_at: string | null;
  is_pinned:    boolean;
}

interface NewsListResponse {
  items: NewsItem[];
  meta:  { total: number; page: number; limit: number; totalPages: number };
}

const TYPE_STYLES: Record<string, string> = {
  ANNOUNCEMENT: 'bg-primary/10 text-primary',
  UPDATE:       'bg-emerald-500/10 text-emerald-600',
  MAINTENANCE:  'bg-destructive/10 text-destructive',
};

async function getNewsList(): Promise<NewsItem[]> {
  try {
    const res = await apiFetch('/news?limit=20&page=1');
    if (!res.ok) return [];
    const data: { data: NewsListResponse } = await res.json();
    return data.data?.items ?? [];
  } catch { return []; }
}

const dashboardPath = process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard';

export default async function DashboardNewsPage() {
  const t     = await getTranslations('dashboard');
  const items = await getNewsList();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Newspaper className="size-6" />
            {t('latestNews')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Stay updated with the latest announcements.</p>
        </div>
      </div>

      {items.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Newspaper className="size-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No news published yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`${dashboardPath}/news/${item.slug}`}
            className="group flex items-start gap-4 rounded-2xl border border-border bg-card px-5 py-4 hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {item.is_pinned && (
                  <span className="text-[0.65rem] font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">📌 Pinned</span>
                )}
                <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full capitalize ${TYPE_STYLES[item.type] ?? 'bg-muted text-muted-foreground'}`}>
                  {item.type.toLowerCase()}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{item.title}</p>
              {item.published_at && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="size-3" />
                  {new Date(item.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
            <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
