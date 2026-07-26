import Link from 'next/link';
import type { Metadata } from 'next';
import { HelpSearch } from './help-search';
import {
  BookOpen, MessageSquarePlus, ArrowRight, LifeBuoy, Clock, FileText,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Find answers to your questions, browse guides, and get support.',
};

interface HelpCategory {
  id: string; slug: string; title: string; description: string | null;
  icon: string | null; articles: { id: string }[];
}

async function getCategories(): Promise<HelpCategory[]> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:10311'}/help/categories`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch { return []; }
}

const dashboardPath = process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard';

export default async function HelpPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-dvh">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            <LifeBuoy className="size-3.5" /> Help Center
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            How can we <span className="text-primary">help you?</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Search our knowledge base or browse topics below to find the answers you need.
          </p>
          <HelpSearch />
        </div>
      </section>

      {/* Categories grid */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        {categories.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="size-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-base font-semibold text-foreground mb-1">No articles published yet</p>
            <p className="text-sm text-muted-foreground">Check back soon or contact us directly.</p>
          </div>
        ) : (
          <>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-8">Browse Topics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/help/${cat.slug}`}
                  className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="size-12 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                      {cat.icon ?? '📄'}
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0" />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">{cat.title}</h3>
                  {cat.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{cat.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                    <FileText className="size-3" /> {cat.articles.length} {cat.articles.length === 1 ? 'article' : 'articles'}
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      {/* CTA — can't find answer */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <MessageSquarePlus className="size-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Still need help?</h2>
          <p className="text-muted-foreground mb-6">
            Can&apos;t find what you&apos;re looking for? Our support team is here to help.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href={`${dashboardPath}/tickets/new`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <LifeBuoy className="size-4" /> Open Support Ticket
            </Link>
            <Link
              href="/pages/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <Clock className="size-4" /> Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
