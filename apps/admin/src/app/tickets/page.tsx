'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

interface Ticket { id: number; ticket_number: string; subject: string; status: string; priority: string; category: string | null; user: { name: string; email: string }; created_at: string; _count: { replies: number }; }

const STATUS_COLOR: Record<string, string> = {
  OPEN:        'bg-primary/12 text-primary',
  IN_PROGRESS: 'bg-success/12 text-success',
  ON_HOLD:     'bg-muted text-muted-foreground',
  RESOLVED:    'bg-success/20 text-success',
  CLOSED:      'bg-muted text-muted-foreground',
};
const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'text-muted-foreground', MEDIUM: 'text-foreground',
  HIGH: 'text-destructive', URGENT: 'text-destructive font-bold',
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus]   = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/tickets', { params: { limit: 50, ...(status ? { status } : {}) } });
      setTickets(data.data?.items ?? data.data?.tickets ?? (Array.isArray(data.data) ? data.data : []));
    } catch { toast.error('Failed to load tickets.'); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const del = async (id: number) => {
    if (!confirm('Delete this ticket permanently?')) return;
    await api.delete(`/admin/tickets/${id}`);
    setTickets((p) => p.filter((t) => t.id !== id));
    toast.success('Ticket deleted.');
  };

  const STATUSES = ['', 'OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card text-foreground">
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All'}</option>)}
        </select>
      </div>

      {loading ? <p className="text-sm text-muted-foreground animate-pulse">Loading…</p> : (
        <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full border-collapse min-w-[640px]">
            <thead className="bg-muted">
              <tr>{['Ticket #', 'Subject', 'User', 'Priority', 'Status', 'Replies', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.ticket_number}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground max-w-[200px] truncate">{t.subject}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.user.name}</td>
                  <td className={cn('px-4 py-3 text-xs', PRIORITY_COLOR[t.priority] ?? '')}>{t.priority}</td>
                  <td className="px-4 py-3"><span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-bold tracking-wide', STATUS_COLOR[t.status] ?? '')}>{t.status}</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t._count.replies}</td>
                  <td className="px-4 py-3"><div className="flex gap-2">
                    <Link href={`/tickets/${t.id}`}><Button variant="ghost" size="sm">View</Button></Link>
                    <Button variant="destructive" size="sm" onClick={() => del(t.id)}>Delete</Button>
                  </div></td>
                </tr>
              ))}
              {tickets.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No tickets</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
