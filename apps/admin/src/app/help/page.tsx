'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Category {
  id: number;
  title: string;
  slug: string;
  is_published: boolean;
  sort_order: number;
}

interface Article {
  id: number;
  title: string;
  slug: string;
  is_published: boolean;
  category: { id: number; title: string };
  sort_order: number;
}

export default function HelpCenterPage() {
  const t = useTranslations('help');
  const router = useRouter();
  const [tab, setTab] = useState<'articles' | 'categories'>('articles');

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'articles') {
        const { data } = await api.get('/admin/help/articles');
        setArticles(data.data?.items ?? []);
      } else {
        const { data } = await api.get('/admin/help/categories');
        setCategories(data.data?.items ?? (Array.isArray(data.data) ? data.data : []));
      }
    } catch {
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deleteCategory = async (id: number) => {
    if (!confirm(t('deleteCategory') + '?')) return;
    try {
      await api.delete(`/admin/help/categories/${id}`);
      setCategories(p => p.filter(c => c.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const deleteArticle = async (id: number) => {
    if (!confirm(t('deleteArticle') + '?')) return;
    try {
      await api.delete(`/admin/help/articles/${id}`);
      setArticles(p => p.filter(a => a.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <div className="flex gap-2">
          {tab === 'articles' ? (
            <Button onClick={() => router.push('/help/articles/new')}>{t('newArticle')}</Button>
          ) : (
            <Button onClick={() => router.push('/help/categories/new')}>{t('newCategory')}</Button>
          )}
        </div>
      </div>

      <div className="flex gap-4 border-b border-border pb-2">
        <button
          className={`font-semibold pb-2 border-b-2 transition-colors ${tab === 'articles' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setTab('articles')}
        >
          {t('articles')}
        </button>
        <button
          className={`font-semibold pb-2 border-b-2 transition-colors ${tab === 'categories' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setTab('categories')}
        >
          {t('categories')}
        </button>
      </div>

      {loading ? (
        <p className="animate-pulse text-muted-foreground">Loading...</p>
      ) : tab === 'articles' ? (
        <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground uppercase text-[0.7rem] tracking-wider text-left">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">{t('noArticles')}</td></tr>
              )}
              {articles.map(a => (
                <tr key={a.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{a.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.category?.title}</td>
                  <td className="px-4 py-3">{a.is_published ? 'Published' : 'Draft'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/help/articles/${a.id}`)}>
                      {t('editArticle')}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteArticle(a.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground uppercase text-[0.7rem] tracking-wider text-left">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">{t('noCategories')}</td></tr>
              )}
              {categories.map(c => (
                <tr key={c.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{c.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                  <td className="px-4 py-3">{c.is_published ? 'Published' : 'Draft'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/help/categories/${c.id}`)}>
                      {t('editCategory')}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteCategory(c.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
