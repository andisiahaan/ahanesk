import Link from 'next/link';
import { LifeBuoy, Plus, MessageSquare, Clock } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export const metadata = { title: 'Support Tickets' };

interface Ticket {
  id:            string;
  ticket_number: string;
  subject:       string;
  status:        string;
  priority:      string;
  created_at:    string;
  _count:        { replies: number };
}

const STATUS_STYLES: Record<string, string> = {
  OPEN:        'bg-primary/10 text-primary border-primary/20',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ON_HOLD:     'bg-amber-500/10 text-amber-600 border-amber-500/20',
  RESOLVED:    'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  CLOSED:      'bg-muted text-muted-foreground border-border',
};

const PRIORITY_DOT: Record<string, string> = {
  LOW:    'bg-muted-foreground',
  MEDIUM: 'bg-blue-500',
  HIGH:   'bg-amber-500',
  URGENT: 'bg-destructive',
};

async function getTickets(): Promise<Ticket[]> {
  try {
    const res = await apiFetch('/tickets?limit=50');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : [];
  } catch { return []; }
}

const dashboardPath = process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard';

export default async function TicketsPage() {
  const tickets = await getTickets();
  const open   = tickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status));
  const closed = tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <LifeBuoy className="size-6" /> Support Tickets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">View and manage your support requests.</p>
        </div>
        <Link
          href={`${dashboardPath}/tickets/new`}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" /> New Ticket
        </Link>
      </div>

      {/* Empty */}
      {tickets.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-16 text-center">
          <LifeBuoy className="size-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-base font-semibold text-foreground mb-1">No tickets yet</p>
          <p className="text-sm text-muted-foreground mb-5">Submit a support ticket and our team will get back to you.</p>
          <Link href={`${dashboardPath}/tickets/new`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="size-4" /> Open a Ticket
          </Link>
        </div>
      )}

      {/* Open tickets */}
      {open.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Active ({open.length})</p>
          {open.map((t) => <TicketRow key={t.id} ticket={t} dashboardPath={dashboardPath} />)}
        </section>
      )}

      {/* Closed tickets */}
      {closed.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Resolved / Closed ({closed.length})</p>
          {closed.map((t) => <TicketRow key={t.id} ticket={t} dashboardPath={dashboardPath} />)}
        </section>
      )}
    </div>
  );
}

function TicketRow({ ticket, dashboardPath }: { ticket: Ticket; dashboardPath: string }) {
  return (
    <Link
      href={`${dashboardPath}/tickets/${ticket.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 hover:border-primary/40 hover:bg-primary/5 transition-all"
    >
      <span className={`size-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[ticket.priority] ?? 'bg-muted'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{ticket.subject}</p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
          <span>{ticket.ticket_number}</span>
          <span>·</span>
          <Clock className="size-3" />
          {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {ticket._count.replies > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="size-3.5" /> {ticket._count.replies}
          </span>
        )}
        <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[ticket.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
          {ticket.status.replace('_', ' ')}
        </span>
      </div>
    </Link>
  );
}
