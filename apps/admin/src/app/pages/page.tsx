'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { RichEditor } from '@/components/rich-editor';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/cn';

interface Page { id: number; slug: string; title: string; is_published: boolean; updated_at: string; }
interface Form { slug: string; title: string; content: string; meta_description: string; is_published: boolean; }

const EMPTY: Form = { slug: '', title: '', content: '', meta_description: '', is_published: false };

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get('/pages');
    setPages(data.data?.items ?? (Array.isArray(data.data) ? data.data : []));
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = async (id: number) => {
    const { data } = await api.get(`/pages/id/${id}`);
    const p = data.data;
    setForm({ slug: p.slug, title: p.title, content: p.content, meta_description: p.meta_description ?? '', is_published: p.is_published });
    setEditing(id);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing === 'new') await api.post('/pages', form);
      else await api.patch(`/pages/${editing}`, form);
      toast.success(editing === 'new' ? 'Page created.' : 'Page updated.');
      setEditing(null); setForm(EMPTY); await load();
    } catch { toast.error('Failed to save page.'); }
    finally { setSaving(false); }
  };

  const deletePage = async (id: number) => {
    if (!confirm('Delete this page?')) return;
    try {
      await api.delete(`/pages/${id}`);
      setPages((p) => p.filter((x) => x.id !== id));
      toast.success('Page deleted.');
    } catch { toast.error('Failed to delete.'); }
  };

  const f = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => {
      if (k === 'title' && editing === 'new') {
        const title = e.target.value;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        return { ...p, title, slug };
      }
      return { ...p, [k]: e.target.value };
    });
  if (editing !== null) return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{editing === 'new' ? 'New Page' : 'Edit Page'}</h1>
        <Button variant="outline" size="sm" onClick={() => { setEditing(null); setForm(EMPTY); }}>← Back</Button>
      </div>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5"><Label>Title</Label><Input value={form.title} onChange={f('title')} placeholder="Page Title" /></div>
          <div className="flex flex-col gap-1.5"><Label>Slug</Label><Input value={form.slug} onChange={f('slug')} placeholder="page-slug" /></div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Meta Description</Label>
          <Input value={form.meta_description} onChange={f('meta_description')} placeholder="SEO description…" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Content</Label>
          <RichEditor content={form.content} onChange={(html) => setForm((p) => ({ ...p, content: html }))} />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.is_published} className="w-4 h-4 accent-primary"
            onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))} />
          <span className="text-sm font-medium text-foreground">Published</span>
        </label>
        <Button onClick={save} loading={saving} className="w-fit">Save Page</Button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Pages</h1>
        <Button onClick={() => { setForm(EMPTY); setEditing('new'); }}>+ New Page</Button>
      </div>
      <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse min-w-[520px]">
          <thead className="bg-muted">
            <tr>
              {['Title', 'Slug', 'Status', 'Updated', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{p.title}</td>
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">/{p.slug}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-bold tracking-wide',
                    p.is_published ? 'bg-success/12 text-success' : 'bg-muted text-muted-foreground',
                  )}>{p.is_published ? 'Published' : 'Draft'}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.updated_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(p.id)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => deletePage(p.id)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
