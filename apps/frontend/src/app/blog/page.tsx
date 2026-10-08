import type { Metadata } from 'next';
import Link from 'next/link';
import { apiFetch, getImageUrl } from '@/lib/api';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read our latest articles, updates, and insights.',
};

interface Post {
  id: number; title: string; slug: string; excerpt: string | null;
  cover_image: string | null; is_featured: boolean;
  published_at: string | null; view_count: number;
  author: { name: string };
  categories: { id: number; name: string; slug: string }[];
}

async function getPosts(search?: string): Promise<Post[]> {
  try {
    const query = new URLSearchParams({ limit: '20' });
    if (search) query.append('search', search);
    
    const res = await apiFetch(`/blog/posts?${query.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.posts ?? [];
  } catch { return []; }
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const { search } = await searchParams;
  const posts = await getPosts(search);
  const t = await getTranslations('blog.list');

  return (
    <div className="w-full">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">
          {search ? `Search Results for "${search}"` : t('heading') || 'Latest Articles'}
        </h1>
        {!search && <p className="text-muted-foreground text-lg">{t('description') || 'Discover our most recent stories and updates.'}</p>}
      </header>

      {posts.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-border rounded-2xl bg-muted/30">
          <p className="text-muted-foreground">{t('noPosts') || 'No posts found.'}</p>
          {search && (
            <Link href="/blog" className="text-primary hover:underline mt-2 inline-block">
              Clear search
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}
              className="group flex flex-col border border-border rounded-2xl overflow-hidden bg-card hover:border-primary/40 hover:shadow-md transition-all duration-300">
              {post.cover_image && (
                <div className="h-48 bg-muted overflow-hidden shrink-0">
                  <img src={getImageUrl(post.cover_image) || ''} alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <div className="p-6 flex flex-col flex-1">
                {post.categories.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {post.categories.map((c) => (
                      <span key={c.id} className="text-[0.65rem] font-bold uppercase tracking-widest text-primary">{c.name}</span>
                    ))}
                  </div>
                )}
                <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors leading-snug mb-2 line-clamp-2">
                  {post.title}
                </h2>
                {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">{post.excerpt}</p>}
                
                <div className="flex items-center justify-between pt-4 border-t border-border mt-auto text-xs text-muted-foreground font-medium">
                  <div className="flex items-center gap-2">
                    <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary">
                      {post.author.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{post.author.name}</span>
                  </div>
                  <span>{post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
