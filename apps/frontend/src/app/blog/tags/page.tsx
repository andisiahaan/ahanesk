import type { Metadata } from 'next';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export const metadata: Metadata = {
  title: 'All Tags | Blog',
  description: 'Browse all blog tags.',
};

async function getTags() {
  try {
    const res = await apiFetch('/blog/tags?limit=200');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : (data.data?.items ?? []);
  } catch { return []; }
}

export default async function BlogTagsPage() {
  const tags = await getTags();

  return (
    <div className="w-full">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">All Tags</h1>
        <p className="text-muted-foreground text-lg">Browse our posts by tags.</p>
      </header>

      {tags.length === 0 ? (
        <p className="text-muted-foreground">No tags found.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((t: any) => (
            <Link key={t.id} href={`/blog/tags/${t.slug}`}
              className="group flex items-center gap-2 px-4 py-2 border border-border rounded-full bg-card hover:border-primary/50 hover:bg-primary hover:text-primary-foreground transition-colors text-sm text-muted-foreground">
              <span className="font-medium group-hover:text-primary-foreground transition-colors">{t.name}</span>
              {t._count?.posts !== undefined && (
                <span className="opacity-70 text-xs">
                  ({t._count.posts})
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
