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

export default function HelpCategoryFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations('help');
  const isNew = id === 'new';

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    icon: '',
    sort_order: 0,
    is_published: true,
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    api.get(`/admin/help/categories`)
      .then(({ data }) => {
        const cat = data.data?.find((c: any) => String(c.id) === String(id));
        if (cat) {
          setFormData({
            title: cat.title,
            slug: cat.slug,
            description: cat.description || '',
            icon: cat.icon || '',
            sort_order: cat.sort_order,
            is_published: cat.is_published,
          });
        } else {
          toast.error('Category not found');
          router.push('/help');
        }
      })
      .catch(() => toast.error('Failed to fetch category'))
      .finally(() => setLoading(false));
  }, [id, isNew, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        await api.post('/admin/help/categories', formData);
        toast.success('Category created');
      } else {
        await api.patch(`/admin/help/categories/${id}`, formData);
        toast.success('Category updated');
      }
      router.push('/help');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving category');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/help')}>
          ← Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{isNew ? t('newCategory') : t('editCategory')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 border border-border rounded-xl p-6 bg-card">
        <div className="grid gap-4">
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

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon (Optional)</Label>
            <Input id="icon" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} />
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
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save Category'}
        </Button>
      </form>
    </div>
  );
}
