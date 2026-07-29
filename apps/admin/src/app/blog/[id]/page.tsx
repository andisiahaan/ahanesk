'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { UPLOAD_CONFIGS } from '@ahanesk/shared';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichEditor } from '@/components/rich-editor';
import { ImagePlus, X } from 'lucide-react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

interface Category { id: string; name: string; }

const EMPTY = {
  title: '', slug: '', excerpt: '', content: '', status: 'DRAFT',
  is_featured: false, allow_comments: true,
  meta_title: '', meta_description: '', meta_keywords: '',
  categories: [] as string[], tags: [] as string[],
};

const cfg = UPLOAD_CONFIGS.blog_cover;

export default function BlogPostEditPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const isNew  = id === 'new';

  const [form, setForm]               = useState(EMPTY);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [saving, setSaving]           = useState(false);
  const [coverFile, setCoverFile]     = useState<File | null>(null);
  const [coverPreview, setCoverPreview]   = useState<string | null>(null);
  const [existingCover, setExistingCover] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const [catRes] = await Promise.all([api.get('/admin/blog/categories')]);
    setCategories(catRes.data.data?.items ?? (Array.isArray(catRes.data.data) ? catRes.data.data : []));
    if (!isNew) {
      const { data } = await api.get(`/admin/blog/posts/${id}`);
      const p = data.data;
      setForm({ ...EMPTY, ...p, categories: p.categories.map((c: Category) => c.id), tags: p.tags.map((t: { name: string }) => t.name) });
      if (p.cover_image) setExistingCover(p.cover_image);
    }
  }, [id, isNew]);

  useEffect(() => { load(); }, [load]);

  const f = (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => {
        if (k === 'title' && isNew) {
          const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          return { ...p, title: e.target.value, slug };
        }
        return { ...p, [k]: e.target.value };
      });

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > cfg.maxSizeBytes) {
      toast.error(`Cover image max ${cfg.maxSizeBytes / 1024 / 1024} MB.`); return;
    }
    if (!(cfg.allowedMimeTypes as readonly string[]).includes(file.type)) {
      toast.error(`Allowed: ${cfg.allowedExtensions.join(', ')}`); return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const removeCover = () => {
    setCoverFile(null); setCoverPreview(null); setExistingCover(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries({ ...form, tags: JSON.stringify(form.tags), categories: JSON.stringify(form.categories) })
        .forEach(([k, v]) => fd.append(k, String(v)));
      if (coverFile) fd.append(cfg.fieldName, coverFile);

      if (isNew) await api.post('/admin/blog/posts', fd);
      else       await api.patch(`/admin/blog/posts/${id}`, fd);
      toast.success(isNew ? 'Post created.' : 'Post updated.');
      router.push('/blog');
    } catch { toast.error('Failed to save post.'); }
    finally { setSaving(false); }
  };

  const previewSrc = coverPreview ?? existingCover;

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{isNew ? 'New Post' : 'Edit Post'}</h1>
        <Button variant="outline" size="sm" onClick={() => router.push('/blog')}>← Back</Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5"><Label>Title</Label><Input value={form.title} onChange={f('title')} placeholder="Post title" /></div>
          <div className="flex flex-col gap-1.5"><Label>Slug</Label><Input value={form.slug} onChange={f('slug')} placeholder="post-slug" /></div>
        </div>
        <div className="flex flex-col gap-1.5"><Label>Excerpt</Label><Input value={form.excerpt} onChange={f('excerpt')} placeholder="Short description…" /></div>
        <div className="flex flex-col gap-1.5"><Label>Content</Label><RichEditor content={form.content} onChange={(html) => setForm((p) => ({ ...p, content: html }))} /></div>

        {/* Cover Image */}
        <div className="flex flex-col gap-1.5">
          <Label>
            Cover Image
            <span className="text-muted-foreground text-xs ml-2">
              max {cfg.maxSizeBytes / 1024 / 1024} MB · {cfg.allowedExtensions.join(', ')}
            </span>
          </Label>
          {previewSrc ? (
            <div className="relative w-48 h-28 rounded-xl overflow-hidden border border-border group">
              <img
                src={previewSrc.startsWith('blob:') ? previewSrc : `${process.env.NEXT_PUBLIC_API_URL}/storage/${previewSrc}`}
                alt="Cover" className="w-full h-full object-cover"
              />
              <button onClick={removeCover}
                className="absolute top-1.5 right-1.5 size-6 bg-card/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground">
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 w-48 h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors text-muted-foreground text-sm justify-center">
              <ImagePlus className="size-5" /> Upload Cover
            </button>
          )}
          <input ref={fileInputRef} type="file" accept={cfg.allowedExtensions.join(',')} className="hidden" onChange={handleCoverChange} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <select value={form.status} onChange={f('status')} className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground">
              {['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tags</Label>
            <CreatableSelect
              isMulti
              placeholder="Type and enter..."
              value={form.tags.map(t => ({ label: t, value: t }))}
              onChange={(v) => setForm(p => ({ ...p, tags: (v as any[]).map(x => x.value) }))}
              className="text-sm text-foreground"
              styles={{ control: (base) => ({ ...base, minHeight: '36px', borderRadius: '0.5rem', borderColor: 'var(--border)' }) }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Categories</Label>
          <Select
            isMulti
            placeholder="Select categories..."
            options={categories.map(c => ({ label: c.name, value: c.id }))}
            value={categories.filter(c => form.categories.includes(c.id)).map(c => ({ label: c.name, value: c.id }))}
            onChange={(v) => setForm(p => ({ ...p, categories: (v as any[]).map(x => x.value) }))}
            className="text-sm text-foreground"
            styles={{ control: (base) => ({ ...base, minHeight: '36px', borderRadius: '0.5rem', borderColor: 'var(--border)' }) }}
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="accent-primary" checked={form.is_featured}
              onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))} /> Featured
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="accent-primary" checked={form.allow_comments}
              onChange={(e) => setForm((p) => ({ ...p, allow_comments: e.target.checked }))} /> Allow comments
          </label>
        </div>

        <Button onClick={save} loading={saving} className="w-fit">Save Post</Button>
      </div>
    </div>
  );
}
