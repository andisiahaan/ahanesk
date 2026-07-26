'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, FileText } from 'lucide-react';

interface Article { id: string; title: string; slug: string; meta_description: string | null; category: { slug: string; title: string } }

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:10311';

export function HelpSearch() {
  const router   = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/help/articles/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.data ?? []);
        setOpen(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [q]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative mx-auto max-w-xl w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for articles, guides, troubleshooting…"
          className="w-full rounded-2xl border border-border bg-card px-12 py-4 text-base shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
        {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground animate-spin" />}
        {q && !loading && (
          <button onClick={() => { setQ(''); setResults([]); setOpen(false); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-border bg-card shadow-xl z-50 overflow-hidden">
          {results.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No articles found for &ldquo;<span className="font-medium text-foreground">{q}</span>&rdquo;
            </div>
          ) : (
            <ul>
              {results.slice(0, 6).map((art) => (
                <li key={art.id}>
                  <button
                    onClick={() => { router.push(`/help/${art.category.slug}/${art.slug}`); setOpen(false); setQ(''); }}
                    className="w-full flex items-start gap-3 px-5 py-3.5 hover:bg-muted transition-colors text-left"
                  >
                    <FileText className="size-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{art.title}</p>
                      <p className="text-xs text-muted-foreground">{art.category.title}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
