import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ChevronRight, LifeBuoy, MessageSquarePlus } from 'lucide-react';
import { HelpfulVote } from './helpful-vote';

interface Article {
  id: string; slug: string; title: string; content: string;
  meta_description: string | null; helpful_yes: number; helpful_no: number;
  category: { id: string; slug: string; title: string };
}

interface PageProps { params: Promise<{ categorySlug: string; articleSlug: string }> }

const API_URL    = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:10311';
const DASH_PATH  = process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard';

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(`${API_URL}/help/articles/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data ?? null;
  } catch { return null; }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { articleSlug } = await params;
  const article = await getArticle(articleSlug);
  if (!article) return { title: 'Article Not Found' };
  return {
    title: `${article.title} — Help Center`,
    description: article.meta_description ?? article.title,
  };
}

export default async function HelpArticlePage({ params }: PageProps) {
  const { categorySlug, articleSlug } = await params;
  const article = await getArticle(articleSlug);
  if (!article || article.category.slug !== categorySlug) notFound();

  const total = article.helpful_yes + article.helpful_no;
  const pct   = total > 0 ? Math.round((article.helpful_yes / total) * 100) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8 flex-wrap">
        <Link href="/help" className="hover:text-foreground transition-colors">Help Center</Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/help/${article.category.slug}`} className="hover:text-foreground transition-colors">
          {article.category.title}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{article.title}</span>
      </nav>

      {/* Article */}
      <article className="space-y-6">
        <h1 className="text-3xl font-extrabold text-foreground leading-tight">{article.title}</h1>

        {/* Content */}
        <div
          className="prose prose-sm dark:prose-invert max-w-none text-foreground prose-headings:font-bold prose-a:text-primary prose-code:bg-muted prose-code:rounded prose-code:px-1"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>

      {/* Helpful vote */}
      <div className="mt-12 rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-sm font-semibold text-foreground mb-4">Was this article helpful?</p>
        <HelpfulVote articleId={article.id} initialYes={article.helpful_yes} initialNo={article.helpful_no} />
        {pct !== null && (
          <p className="text-xs text-muted-foreground mt-3">{pct}% of readers found this helpful ({total} ratings)</p>
        )}
      </div>

      {/* CTA */}
      <div className="mt-8 rounded-2xl border border-border bg-muted/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Still have questions?</p>
          <p className="text-xs text-muted-foreground mt-0.5">Our team is here to help you out.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
          <Link href={`${DASH_PATH}/tickets/new`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            <LifeBuoy className="size-3.5" /> Open Ticket
          </Link>
          <Link href="/pages/contact"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors">
            <MessageSquarePlus className="size-3.5" /> Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
