'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

interface Post { id: number; title: string; slug: string; status: string; is_featured: boolean; published_at: string | null; view_count: number; author: { name: string }; }

const STATUS_BADGE: Record<string, string> = {
  DRAFT:     'bg-muted text-muted-foreground',
  PUBLISHED: 'bg-success/12 text-success',
  SCHEDULED: 'bg-primary/12 text-primary',
  ARCHIVED:  'bg-destructive/12 text-destructive',
};

export default function BlogPostsPage() {
  const [posts, setPosts]   = useState<Post[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/blog/posts', { params: { limit: 50, ...(status ? { status } : {}) } });
      setPosts(data.data?.items ?? data.data?.posts ?? (Array.isArray(data.data) ? data.data : []));
    } catch { toast.error('Failed to load posts.'); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const deletePost = async (id: number) => {
    if (!confirm('Delete this post?')) return;
    try {
      await api.delete(`/admin/blog/posts/${id}`);
      setPosts((p) => p.filter((x) => x.id !== id));
      toast.success('Post deleted.');
    } catch { toast.error('Failed to delete post.'); }
  };

  const STATUSES = ['', 'DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Blog Posts</h1>
        <div className="flex gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card text-foreground">
            {STATUSES.map((s) => <option key={s} value={s}>{s || 'All'}</option>)}
          </select>
          <Link href="/blog/new"><Button>+ New Post</Button></Link>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <Link href="/blog/categories"><Button variant="outline" size="sm">Categories</Button></Link>
      </div>

      {loading ? <p className="text-sm text-muted-foreground animate-pulse">Loading…</p> : (
        <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full border-collapse min-w-[600px]">
            <thead className="bg-muted">
              <tr>
                {['Title', 'Author', 'Status', 'Published', 'Views', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground max-w-[220px] truncate">
                    {p.is_featured && <span className="mr-1 text-primary">★</span>}{p.title}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.author.name}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-bold tracking-wide', STATUS_BADGE[p.status] ?? '')}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.published_at ? new Date(p.published_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.view_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/blog/${p.id}`}><Button variant="ghost" size="sm">Edit</Button></Link>
                      <Button variant="destructive" size="sm" onClick={() => deletePost(p.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No posts found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
