import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, getImageUrl } from '@/lib/api';

interface Post {
  title: string; slug: string; excerpt: string | null; content: string;
  cover_image: string | null; published_at: string | null; view_count: number;
  meta_title: string | null; meta_description: string | null;
  author: { name: string; avatar: string | null };
  categories: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string }[];
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const res = await apiFetch(`/blog/posts/${slug}`);
    if (!res.ok) return null;
    const { data } = await res.json();
    return data;
  } catch { return null; }
}

async function getRelatedPosts(categorySlug: string | undefined, currentSlug: string) {
  if (!categorySlug) return [];
  try {
    const res = await apiFetch(`/blog/posts?category=${categorySlug}&limit=3`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data?.posts ?? []).filter((p: any) => p.slug !== currentSlug).slice(0, 2);
  } catch { return []; }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Not Found' };
  return {
    title: post.meta_title ?? post.title,
    description: post.meta_description ?? post.excerpt ?? '',
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const primaryCategory = post.categories[0]?.slug;
  const relatedPosts = await getRelatedPosts(primaryCategory, slug);

  return (
    <div className="w-full">
      <article className="w-full">
        {post.cover_image && (
          <div className="mb-8 rounded-2xl overflow-hidden h-64 md:h-[400px]">
            <img src={getImageUrl(post.cover_image) || ''} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <header className="mb-10">
          {post.categories.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {post.categories.map((c) => (
                <Link key={c.id} href={`/blog/categories/${c.slug}`} className="text-xs font-bold uppercase tracking-widest text-primary hover:underline">
                  {c.name}
                </Link>
              ))}
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-6 tracking-tight">{post.title}</h1>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground border-y border-border py-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {post.author.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-foreground">{post.author.name}</span>
            </div>
            {post.published_at && (
              <>
                <span className="text-border px-2">|</span>
                <span>{new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </>
            )}
            <span className="text-border px-2">|</span>
            <span>{post.view_count} views</span>
          </div>
        </header>

        <div
          className="prose prose-neutral dark:prose-invert max-w-none prose-img:rounded-xl prose-headings:font-bold prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {post.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2 pt-6 border-t border-border">
            <span className="text-sm font-bold text-foreground flex items-center mr-2">Tags:</span>
            {post.tags.map((t) => (
              <Link key={t.id} href={`/blog/tags/${t.slug}`} className="px-3 py-1 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground text-xs text-muted-foreground transition-colors">
                {t.name}
              </Link>
            ))}
          </div>
        )}
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="mt-16 pt-10 border-t border-border">
          <h3 className="text-2xl font-bold text-foreground mb-6">Related Posts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedPosts.map((rp: any) => (
              <Link key={rp.id} href={`/blog/${rp.slug}`} className="group flex flex-col border border-border rounded-xl overflow-hidden bg-card hover:border-primary/40 transition-colors">
                {rp.cover_image && (
                  <div className="h-40 bg-muted overflow-hidden shrink-0">
                    <img src={getImageUrl(rp.cover_image) || ''} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-4 flex flex-col">
                  <h4 className="font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">{rp.title}</h4>
                  <span className="text-xs text-muted-foreground mt-2">
                    {rp.published_at ? new Date(rp.published_at).toLocaleDateString() : ''}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
