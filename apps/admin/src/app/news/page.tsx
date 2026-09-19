'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichEditor } from '@/components/rich-editor';
import { cn } from '@/lib/cn';

interface NewsItem { id: number; title: string; slug: string; type: string; is_published: boolean; is_pinned: boolean; published_at: string | null; expires_at: string | null; }
interface Form { title: string; slug: string; content: string; type: string; is_published: boolean; is_pinned: boolean; published_at: string; expires_at: string; }
const EMPTY: Form = { title: '', slug: '', content: '', type: 'ANNOUNCEMENT', is_published: false, is_pinned: false, published_at: '', expires_at: '' };

const TYPE_COLORS: Record<string, string> = {
  ANNOUNCEMENT: 'bg-primary/12 text-primary',
  UPDATE:       'bg-success/12 text-success',
  MAINTENANCE:  'bg-destructive/12 text-destructive',
};

export default function NewsPage() {
  const [items, setItems]   = useState<NewsItem[]>([]);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [form, setForm]     = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get('/admin/news', { params: { limit: 50 } });
    setItems(data.data?.items ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = async (id: number) => {
    const { data } = await api.get(`/admin/news/${id}`);
    const n = data.data;
    setForm({ ...EMPTY, ...n, published_at: n.published_at ? n.published_at.slice(0, 16) : '', expires_at: n.expires_at ? n.expires_at.slice(0, 16) : '' });
    setEditing(id);
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = { ...form, published_at: form.published_at || null, expires_at: form.expires_at || null };
      if (editing === 'new') await api.post('/admin/news', body);
      else await api.patch(`/admin/news/${editing}`, body);
      toast.success('Saved.'); setEditing(null); setForm(EMPTY); await load();
    } catch { toast.error('Failed to save.'); }
    finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm('Delete this news item?')) return;
    await api.delete(`/admin/news/${id}`);
    setItems((p) => p.filter((n) => n.id !== id));
    toast.success('Deleted.');
  };

  const f = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setForm((p) => {
      // If we are creating a new item, auto-generate slug from title
      if (editing === 'new') {
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        return { ...p, title, slug };
      }
      return { ...p, title };
    });
  };

  if (editing !== null) return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{editing === 'new' ? 'New News Item' : 'Edit News Item'}</h1>
        <Button variant="outline" size="sm" onClick={() => { setEditing(null); setForm(EMPTY); }}>← Back</Button>
      </div>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5"><Label>Title</Label><Input value={form.title} onChange={handleTitleChange} /></div>
          <div className="flex flex-col gap-1.5"><Label>Slug</Label><Input value={form.slug} onChange={f('slug')} /></div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Type</Label>
          <select value={form.type} onChange={f('type')} className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground">
            {['ANNOUNCEMENT', 'UPDATE', 'MAINTENANCE'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5"><Label>Content</Label><RichEditor content={form.content} onChange={(html) => setForm((p) => ({ ...p, content: html }))} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5"><Label>Publish At</Label><Input type="datetime-local" value={form.published_at} onChange={f('published_at')} /></div>
          <div className="flex flex-col gap-1.5"><Label>Expires At</Label><Input type="datetime-local" value={form.expires_at} onChange={f('expires_at')} /></div>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="accent-primary" checked={form.is_published} onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))} /> Published</label>
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="accent-primary" checked={form.is_pinned} onChange={(e) => setForm((p) => ({ ...p, is_pinned: e.target.checked }))} /> Pinned</label>
        </div>
        <Button onClick={save} loading={saving} className="w-fit">Save</Button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">News</h1>
        <Button onClick={() => { 
          const now = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          setForm({ ...EMPTY, published_at: now, is_published: true }); 
          setEditing('new'); 
        }}>+ New Item</Button>
      </div>
      <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse min-w-[580px]">
          <thead className="bg-muted">
            <tr>{['Title', 'Type', 'Pinned', 'Published', 'Expires', 'Actions'].map((h) => <th key={h} className="px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground">{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((n) => (
              <tr key={n.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-foreground max-w-[200px] truncate">{n.title}</td>
                <td className="px-4 py-3"><span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-bold tracking-wide', TYPE_COLORS[n.type] ?? '')}>{n.type}</span></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{n.is_pinned ? '📌' : '—'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{n.is_published ? (n.published_at ? new Date(n.published_at).toLocaleDateString() : 'Yes') : 'Draft'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{n.expires_at ? new Date(n.expires_at).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3"><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => startEdit(n.id)}>Edit</Button><Button variant="destructive" size="sm" onClick={() => del(n.id)}>Delete</Button></div></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No news items</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
