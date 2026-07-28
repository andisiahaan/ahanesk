import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { getImageUrl } from '@/lib/api';

async function getSidebarData() {
  const [popularRes, categoriesRes, tagsRes] = await Promise.all([
    apiFetch('/blog/posts?sort=popular&limit=5').catch(() => null),
    apiFetch('/blog/categories').catch(() => null),
    apiFetch('/blog/tags?limit=50').catch(() => null),
  ]);

  const popular = popularRes?.ok ? (await popularRes.json()).data?.posts ?? [] : [];
  const categoriesData = categoriesRes?.ok ? (await categoriesRes.json()).data : [];
  const tagsData = tagsRes?.ok ? (await tagsRes.json()).data : [];

  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.items ?? []);
  const allTags = Array.isArray(tagsData) ? tagsData : (tagsData?.items ?? []);

  // Randomize 20 tags for the cloud
  const shuffledTags = [...allTags].sort(() => 0.5 - Math.random());
  const tags = shuffledTags.slice(0, 20);

  return { popular, categories, tags };
}

export async function BlogSidebar() {
  const { popular, categories, tags } = await getSidebarData();

  return (
    <div className="flex flex-col gap-8">
      {/* Search Bar */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-bold text-foreground mb-4">Search Articles</h3>
        <form action="/blog" method="GET" className="flex gap-2">
          <input
            type="text"
            name="search"
            placeholder="Search..."
            className="flex-1 h-9 rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          />
          <button
            type="submit"
            className="h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Search
          </button>
        </form>
      </div>

      {/* Popular Posts */}
      {popular.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-bold text-foreground mb-4">Popular Posts</h3>
          <div className="flex flex-col gap-4">
            {popular.map((post: any) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group flex gap-3 items-start">
                {post.cover_image && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
                    <img
                      src={getImageUrl(post.cover_image) || ''}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="flex flex-col">
                  <h4 className="text-sm font-medium leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                  <span className="text-xs text-muted-foreground mt-1">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Popular Categories */}
      {categories.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-bold text-foreground mb-4">Popular Categories</h3>
          <ul className="flex flex-col gap-2">
            {categories.map((cat: any) => (
              <li key={cat.id}>
                <Link
                  href={`/blog/categories/${cat.slug}`}
                  className="flex items-center justify-between text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <span>{cat.name}</span>
                  {cat._count?.posts !== undefined && (
                    <span className="bg-muted px-2 py-0.5 rounded-full text-xs">
                      {cat._count.posts}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags Cloud */}
      {tags.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-bold text-foreground mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: any) => (
              <Link
                key={tag.id}
                href={`/blog/tags/${tag.slug}`}
                className="px-3 py-1 bg-muted hover:bg-primary hover:text-primary-foreground transition-colors rounded-full text-xs text-muted-foreground"
              >
                {tag.name}
              </Link>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <Link href="/blog/tags" className="text-sm text-primary hover:underline font-medium">
              View all tags →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
