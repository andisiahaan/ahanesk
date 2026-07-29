import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { getTranslations } from 'next-intl/server';
import { Logo } from '@ahanesk/ui';
import { BlogNavbarActions } from './blog-navbar-actions';

async function getCategories() {
  try {
    const res = await apiFetch('/blog/categories');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : (data.data?.items ?? []);
  } catch { return []; }
}

export async function BlogNavbar() {
  const categories = await getCategories();
  // limit to 4 general categories for the navbar
  const topCategories = categories.slice(0, 4);
  const t = await getTranslations('blog.nav');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-6xl mx-auto px-4 items-center gap-6">
        <Link href="/blog" className="flex items-center gap-2 font-bold tracking-tight hover:opacity-80 transition-opacity">
          <Logo width={90} height={20} frontendUrl={process.env.NEXT_PUBLIC_FRONTEND_URL} />
          <span className="text-primary hidden sm:inline-block">Blog</span>
        </Link>
        
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/blog" className="transition-colors hover:text-foreground/80 text-foreground/60">
            {t('home') || 'Home'}
          </Link>
          {topCategories.map((c: any) => (
            <Link key={c.id} href={`/blog/categories/${c.slug}`} className="transition-colors hover:text-foreground/80 text-foreground/60 hidden md:block">
              {c.name}
            </Link>
          ))}
          <Link href="/blog/categories" className="transition-colors hover:text-foreground/80 text-foreground/60">
            {t('categories') || 'All Categories'}
          </Link>
        </nav>

        <BlogNavbarActions />
      </div>
    </header>
  );
}
