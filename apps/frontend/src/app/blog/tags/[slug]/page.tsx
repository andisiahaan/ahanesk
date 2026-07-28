import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, getImageUrl } from '@/lib/api';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Tag: ${slug} | Blog` };
}

async function getTagPosts(slug: string) {
  try {
    const res = await apiFetch(`/blog/posts?tag=${slug}&limit=20`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.posts ?? [];
  } catch { return []; }
}

export default async function BlogTagPage({ params }: Props) {
  const { slug } = await params;
  const posts = await getTagPosts(slug);

  return (
    <div className="w-full">
      <header className="mb-10">
        <div className="flex items-center gap-2 text-sm text-primary font-bold uppercase tracking-widest mb-2">
          <Link href="/blog/tags" className="hover:underline">Tags</Link>
          <span>/</span>
        </div>
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">#{slug}</h1>
        <p className="text-muted-foreground text-lg">Posts tagged with {slug}.</p>
      </header>

      {posts.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-border rounded-2xl bg-muted/30">
          <p className="text-muted-foreground">No posts found with this tag.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post: any) => (
            <Link key={post.id} href={`/blog/${post.slug}`}
              className="group flex flex-col border border-border rounded-2xl overflow-hidden bg-card hover:border-primary/40 hover:shadow-md transition-all duration-300">
              {post.cover_image && (
                <div className="h-48 bg-muted overflow-hidden shrink-0">
                  <img src={getImageUrl(post.cover_image) || ''} alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <div className="p-6 flex flex-col flex-1">
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
