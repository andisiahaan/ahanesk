'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function HelpArticleFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations('help');
  const isNew = id === 'new';

  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    slug: '',
    content: '',
    meta_description: '',
    sort_order: 0,
    is_published: false,
  });
  const [categories, setCategories] = useState<{ id: number; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch categories for the select dropdown
    api.get('/admin/help/categories')
      .then(({ data }) => setCategories(data.data?.items ?? (Array.isArray(data.data) ? data.data : [])))
      .catch(() => toast.error('Failed to load categories'));

    if (isNew) {
      setLoading(false);
      return;
    }

    api.get(`/admin/help/articles/${id}`)
      .then(({ data }) => {
        const art = data.data;
        if (art) {
          setFormData({
            category_id: art.category_id,
            title: art.title,
            slug: art.slug,
            content: art.content || '',
            meta_description: art.meta_description || '',
            sort_order: art.sort_order,
            is_published: art.is_published,
          });
        } else {
          toast.error('Article not found');
          router.push('/help');
        }
      })
      .catch(() => toast.error('Failed to fetch article'))
      .finally(() => setLoading(false));
  }, [id, isNew, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id) return toast.error('Please select a category');
    
    setSaving(true);
    try {
      const payload = { ...formData, category_id: Number(formData.category_id), sort_order: Number(formData.sort_order) };
      if (isNew) {
        await api.post('/admin/help/articles', payload);
        toast.success('Article created');
      } else {
        await api.patch(`/admin/help/articles/${id}`, payload);
        toast.success('Article updated');
      }
      router.push('/help');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving article');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/help')}>
          ← Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{isNew ? t('newArticle') : t('editArticle')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 border border-border rounded-xl p-6 bg-card flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" required value={formData.title} onChange={e => {
              const title = e.target.value;
              if (isNew) {
                const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                setFormData({ ...formData, title, slug });
              } else {
                setFormData({ ...formData, title });
              }
            }} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input id="slug" required value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
          </div>

          <div className="space-y-2 flex-1 flex flex-col">
            <Label htmlFor="content">Content * (Markdown / HTML)</Label>
            <textarea
              id="content"
              required
              rows={12}
              className="flex-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
            />
          </div>
        </div>

        <div className="w-full md:w-72 flex flex-col gap-6">
          <div className="space-y-2">
            <Label htmlFor="category_id">Category *</Label>
            <select
              id="category_id"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={formData.category_id}
              onChange={e => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="" disabled>Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta_description">Meta Description</Label>
            <textarea
              id="meta_description"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={formData.meta_description}
              onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input id="sort_order" type="number" required value={formData.sort_order} onChange={e => setFormData({ ...formData, sort_order: Number(e.target.value) })} />
            </div>

            <div className="space-y-2 flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer h-10">
                <input
                  type="checkbox"
                  className="rounded border-input"
                  checked={formData.is_published}
                  onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                />
                <span className="text-sm font-medium">Published</span>
              </label>
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full mt-auto">
            {saving ? 'Saving...' : 'Save Article'}
          </Button>
        </div>
      </form>
    </div>
  );
}
