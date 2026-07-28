import type { Metadata } from 'next';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export const metadata: Metadata = {
  title: 'All Categories | Blog',
  description: 'Browse all blog categories.',
};

async function getCategories() {
  try {
    const res = await apiFetch('/blog/categories');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : (data.data?.items ?? []);
  } catch { return []; }
}

export default async function BlogCategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="w-full">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">All Categories</h1>
        <p className="text-muted-foreground text-lg">Browse our posts by topic.</p>
      </header>

      {categories.length === 0 ? (
        <p className="text-muted-foreground">No categories found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((c: any) => (
            <Link key={c.id} href={`/blog/categories/${c.slug}`}
              className="group flex items-center justify-between p-4 border border-border rounded-xl bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors">
              <span className="font-bold text-foreground group-hover:text-primary transition-colors">{c.name}</span>
              {c._count?.posts !== undefined && (
                <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium">
                  {c._count.posts} posts
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
