import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ChevronRight, FileText, ArrowRight } from 'lucide-react';

interface Article {
  id: string; slug: string; title: string;
  meta_description: string | null; sort_order: number;
}
interface Category {
  id: string; slug: string; title: string; description: string | null;
  icon: string | null; articles: Article[];
}

interface PageProps { params: Promise<{ categorySlug: string }> }

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:10311';

async function getCategory(slug: string): Promise<Category | null> {
  try {
    const res = await fetch(`${API_URL}/help/categories`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    const categories: Category[] = data.data ?? [];
    return categories.find((c) => c.slug === slug) ?? null;
  } catch { return null; }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const cat = await getCategory(categorySlug);
  if (!cat) return { title: 'Category Not Found' };
  return {
    title: `${cat.title} — Help Center`,
    description: cat.description ?? `Browse articles in ${cat.title}`,
  };
}

export default async function HelpCategoryPage({ params }: PageProps) {
  const { categorySlug } = await params;
  const cat = await getCategory(categorySlug);
  if (!cat) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
        <Link href="/help" className="hover:text-foreground transition-colors">Help Center</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium">{cat.title}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl mb-4">
          {cat.icon ?? '📁'}
        </div>
        <h1 className="text-3xl font-extrabold text-foreground mb-2">{cat.title}</h1>
        {cat.description && (
          <p className="text-muted-foreground">{cat.description}</p>
        )}
      </div>

      {/* Article list */}
      {cat.articles.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <FileText className="size-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No articles published in this category yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cat.articles
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((article) => (
              <Link
                key={article.id}
                href={`/help/${cat.slug}/${article.slug}`}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <FileText className="size-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{article.title}</p>
                  {article.meta_description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{article.meta_description}</p>
                  )}
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
