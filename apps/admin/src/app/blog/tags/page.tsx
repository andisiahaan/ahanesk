'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Tag { id: string; name: string; slug: string; _count?: { posts: number } }
interface Form { name: string; slug: string }
const EMPTY: Form = { name: '', slug: '' };

const toSlug = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

export default function BlogTagsPage() {
  const [tags, setTags]         = useState<Tag[]>([]);
  const [editing, setEditing]   = useState<string | null>(null);
  const [form, setForm]         = useState<Form>(EMPTY);
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/blog/tags?limit=200');
      setTags(data.data?.items ?? (Array.isArray(data.data) ? data.data : []));
    } catch { toast.error('Failed to load tags.'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onChange = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({
      ...prev,
      [k]: e.target.value,
      ...(k === 'name' && editing === 'new' ? { slug: toSlug(e.target.value) } : {}),
    }));

  const startEdit = (tag: Tag) => { setForm({ name: tag.name, slug: tag.slug }); setEditing(tag.id); };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name is required.'); return; }
    setSaving(true);
    try {
      if (editing === 'new') await api.post('/admin/blog/tags', form);
      else await api.patch(`/admin/blog/tags/${editing}`, form);
      toast.success('Tag saved.');
      setEditing(null); setForm(EMPTY); await load();
    } catch { toast.error('Failed to save tag.'); }
    finally { setSaving(false); }
  };

  const del = async (id: string, name: string) => {
    if (!confirm(`Delete tag "${name}"? It will be detached from all posts.`)) return;
    try {
      await api.delete(`/admin/blog/tags/${id}`);
      setTags((prev) => prev.filter((t) => t.id !== id));
      toast.success('Tag deleted.');
    } catch { toast.error('Failed to delete tag.'); }
  };

  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Blog Tags</h1>
        <Button onClick={() => { setForm(EMPTY); setEditing('new'); }}>+ New Tag</Button>
      </div>

      {editing !== null && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">{editing === 'new' ? 'New Tag' : 'Edit Tag'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={onChange('name')} placeholder="e.g. JavaScript" autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={onChange('slug')} placeholder="e.g. javascript" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} loading={saving}>Save</Button>
            <Button variant="outline" onClick={() => { setEditing(null); setForm(EMPTY); }}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-muted">
            <tr>
              {['Name', 'Slug', 'Posts', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{tag.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tag.slug}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{tag._count?.posts ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(tag)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => del(tag.id, tag.name)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
            {tags.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No tags yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
