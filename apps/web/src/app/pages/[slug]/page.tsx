import { apiFetch } from '@/lib/api';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await apiFetch(`/pages/${slug}`);
    if (!res.ok) return { title: 'Page Not Found' };
    const { data } = await res.json();
    return { title: data.title, description: data.meta_description ?? undefined };
  } catch { return { title: 'Page Not Found' }; }
}

export default async function PublicPage({ params }: Props) {
  const { slug } = await params;
  let page: { title: string; content: string } | null = null;

  try {
    const res = await apiFetch(`/pages/${slug}`);
    if (!res.ok) notFound();
    const { data } = await res.json();
    page = data;
  } catch { notFound(); }

  if (!page) notFound();

  return (
    <main className="max-w-4xl mx-auto w-full px-4 py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">{page.title}</h1>
      <div
        className="text-foreground/90 leading-relaxed space-y-4 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-4 [&>h3]:text-xl [&>h3]:font-bold [&>h3]:mt-6 [&>h3]:mb-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>a]:text-primary [&>a]:underline"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </main>
  );
}
