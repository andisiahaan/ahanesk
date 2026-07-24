import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface NewsDetail {
  id:           string;
  title:        string;
  slug:         string;
  content:      string;
  type:         string;
  published_at: string | null;
  is_pinned:    boolean;
}

const TYPE_STYLES: Record<string, string> = {
  ANNOUNCEMENT: 'bg-primary/10 text-primary',
  UPDATE:       'bg-emerald-500/10 text-emerald-600',
  MAINTENANCE:  'bg-destructive/10 text-destructive',
};

async function getNews(slug: string): Promise<NewsDetail | null> {
  try {
    const res = await apiFetch(`/news/${slug}`);
    if (!res.ok) return null;
    const data: { data: NewsDetail } = await res.json();
    return data.data ?? null;
  } catch { return null; }
}

const dashboardPath = process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard';

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getNews(slug);
  if (!item) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`${dashboardPath}/news`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" /> Back to News
      </Link>

      <article className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-5">
        <header className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {item.is_pinned && (
              <span className="text-[0.65rem] font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">📌 Pinned</span>
            )}
            <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${TYPE_STYLES[item.type] ?? 'bg-muted text-muted-foreground'}`}>
              <Tag className="size-2.5" />
              {item.type.charAt(0) + item.type.slice(1).toLowerCase()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{item.title}</h1>
          {item.published_at && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              {new Date(item.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </header>

        <hr className="border-border" />

        <div
          className="prose prose-sm dark:prose-invert max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: item.content }}
        />
      </article>
    </div>
  );
}
