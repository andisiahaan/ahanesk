'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Category { id: number; name: string; slug: string; is_active: boolean; _count?: { posts: number }; }
interface Form { name: string; slug: string; description: string; }
const EMPTY: Form = { name: '', slug: '', description: '' };

export default function BlogCategoriesPage() {
  const [cats, setCats]     = useState<Category[]>([]);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [form, setForm]     = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get('/admin/blog/categories');
    setCats(data.data?.items ?? (Array.isArray(data.data) ? data.data : []));
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (c: Category) => {
    setForm({ name: c.name, slug: c.slug, description: '' });
    setEditing(c.id);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing === 'new') await api.post('/admin/blog/categories', form);
      else await api.patch(`/admin/blog/categories/${editing}`, form);
      toast.success('Category saved.');
      setEditing(null); setForm(EMPTY); await load();
    } catch { toast.error('Failed to save category.'); }
    finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    await api.delete(`/admin/blog/categories/${id}`);
    setCats((p) => p.filter((c) => c.id !== id));
    toast.success('Deleted.');
  };

  const f = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => {
    if (k === 'name' && editing === 'new') {
      const name = e.target.value;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      return { ...p, name, slug };
    }
    return { ...p, [k]: e.target.value };
  });

  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Blog Categories</h1>
        <Button onClick={() => { setForm(EMPTY); setEditing('new'); }}>+ New</Button>
      </div>

      {editing !== null && (
        <div className="mb-6 border border-border rounded-xl p-5 bg-card flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-foreground">{editing === 'new' ? 'New Category' : 'Edit Category'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5"><Label>Name</Label><Input value={form.name} onChange={f('name')} /></div>
            <div className="flex flex-col gap-1.5"><Label>Slug</Label><Input value={form.slug} onChange={f('slug')} /></div>
          </div>
          <div className="flex flex-col gap-1.5"><Label>Description</Label><Input value={form.description} onChange={f('description')} /></div>
          <div className="flex gap-2">
            <Button onClick={save} loading={saving}>Save</Button>
            <Button variant="outline" onClick={() => { setEditing(null); setForm(EMPTY); }}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-muted">
            <tr>{['Name', 'Slug', 'Posts', 'Actions'].map((h) => <th key={h} className="px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground">{h}</th>)}</tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c._count?.posts ?? 0}</td>
                <td className="px-4 py-3"><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => startEdit(c)}>Edit</Button><Button variant="destructive" size="sm" onClick={() => del(c.id)}>Delete</Button></div></td>
              </tr>
            ))}
            {cats.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No categories</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
