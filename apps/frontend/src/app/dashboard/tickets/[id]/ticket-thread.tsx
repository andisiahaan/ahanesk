'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, MessageSquare, Shield, XCircle, Clock, Paperclip, X } from 'lucide-react';
import { UPLOAD_CONFIGS, CreateReplySchema, type CreateReplyDto } from '@ahanesk/shared';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

interface Reply {
  id: string; message: string; is_staff_reply: boolean; created_at: string;
  attachments?: string[];
  user: { id: string; name: string; role: string };
}
interface Ticket {
  id: string; ticket_number: string; subject: string; description: string;
  category: string | null; status: string; priority: string;
  created_at: string; closed_at: string | null;
  user: { id: string; name: string; email: string };
  replies: Reply[];
}

const STATUS_STYLES: Record<string, string> = {
  OPEN:        'bg-primary/10 text-primary border-primary/20',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ON_HOLD:     'bg-amber-500/10 text-amber-600 border-amber-500/20',
  RESOLVED:    'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  CLOSED:      'bg-muted text-muted-foreground border-border',
};

const dashboardPath = process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard';
const cfg = UPLOAD_CONFIGS.ticket_attachment;

export function TicketThread({ ticket: initial }: { ticket: Ticket }) {
  const router = useRouter();
  const [ticket, setTicket]       = useState<Ticket>(initial);
  const [closing, setClosing]     = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateReplyDto>({
    resolver: zodResolver(CreateReplySchema),
  });

  const isClosed = ['CLOSED', 'RESOLVED'].includes(ticket.status);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...attachments, ...Array.from(list)];
    if (next.length > cfg.maxFiles) { toast.error(`Max ${cfg.maxFiles} attachments.`); return; }
    const invalid = Array.from(list).find((f) => !(cfg.allowedMimeTypes as readonly string[]).includes(f.type));
    if (invalid) { toast.error(`${invalid.name}: unsupported type.`); return; }
    const oversized = Array.from(list).find((f) => f.size > cfg.maxSizeBytes);
    if (oversized) { toast.error(`${oversized.name} exceeds ${cfg.maxSizeBytes / 1024 / 1024} MB.`); return; }
    setAttachments(next);
  };

  const onReply = async (data: CreateReplyDto) => {
    try {
      const fd = new FormData();
      fd.append('message', data.message);
      attachments.forEach((f) => fd.append(cfg.fieldName, f));
      const res = await api.post(`/tickets/${ticket.id}/reply`, fd);
      setTicket((prev) => ({ ...prev, replies: [...prev.replies, res.data.data] }));
      reset(); setAttachments([]);
      toast.success('Reply sent.');
    } catch { toast.error('Failed to send reply. Please try again.'); }
  };

  const onClose = async () => {
    if (!confirm('Close this ticket? You won\'t be able to re-open it.')) return;
    setClosing(true);
    try {
      await api.patch(`/tickets/${ticket.id}/close`);
      setTicket((prev) => ({ ...prev, status: 'CLOSED', closed_at: new Date().toISOString() }));
      toast.success('Ticket closed.');
    } catch { toast.error('Failed to close ticket.'); }
    finally { setClosing(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => router.push(`${dashboardPath}/tickets`)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" /> All Tickets
      </button>

      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1 font-mono">{ticket.ticket_number}</p>
            <h1 className="text-xl font-bold text-foreground">{ticket.subject}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[ticket.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
                {ticket.status.replace('_', ' ')}
              </span>
              {ticket.category && <span className="text-[0.65rem] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{ticket.category}</span>}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" />
                {new Date(ticket.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
          {!isClosed && (
            <Button variant="outline" size="sm" loading={closing} onClick={onClose}
              className="text-muted-foreground hover:text-destructive hover:border-destructive/50">
              <XCircle className="size-4 mr-1.5" /> Close Ticket
            </Button>
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="space-y-3">
        <MessageBubble name={ticket.user.name} isStaff={false} date={ticket.created_at} message={ticket.description} isFirst />
        {ticket.replies.map((r) => (
          <MessageBubble key={r.id} name={r.user.name} isStaff={r.is_staff_reply}
            date={r.created_at} message={r.message} attachments={r.attachments} />
        ))}
        {isClosed && (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <XCircle className="size-3.5" />
              This ticket has been {ticket.status.toLowerCase()}
              {ticket.closed_at && ` on ${new Date(ticket.closed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}.
            </p>
          </div>
        )}
      </div>

      {/* Reply form */}
      {!isClosed && (
        <form onSubmit={handleSubmit(onReply)} className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="size-4" /> Add Reply
          </h2>
          <textarea rows={4} placeholder="Type your reply…"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            {...register('message')} />
          {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}

          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
              <Paperclip className="size-4" />
              Attach files
              <span className="text-xs opacity-70">
                ({attachments.length}/{cfg.maxFiles} · max {cfg.maxSizeBytes / 1024 / 1024} MB · {cfg.allowedExtensions.join(', ')})
              </span>
            </button>
            <input ref={fileInputRef} type="file" multiple accept={cfg.allowedExtensions.join(',')}
              className="hidden" onChange={(e) => addFiles(e.target.files)} />
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((f, i) => (
                  <span key={i} className="flex items-center gap-1 bg-muted text-xs rounded-full px-2.5 py-1">
                    {f.name}
                    <button type="button" onClick={() => setAttachments((p) => p.filter((_, idx) => idx !== i))} className="hover:text-destructive ml-0.5">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={isSubmitting} size="sm">Send Reply</Button>
          </div>
        </form>
      )}
    </div>
  );
}

function MessageBubble({ name, isStaff, date, message, isFirst = false, attachments }: {
  name: string; isStaff: boolean; date: string; message: string; isFirst?: boolean; attachments?: string[];
}) {
  return (
    <div className={cn('rounded-2xl border p-5', isStaff ? 'border-primary/20 bg-primary/5' : 'border-border bg-card')}>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('size-7 rounded-full flex items-center justify-center text-xs font-bold',
          isStaff ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
          {isStaff ? <Shield className="size-3.5" /> : name[0]?.toUpperCase()}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-foreground">{isStaff ? 'Support Team' : name}</span>
          {isFirst && <span className="text-[0.6rem] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Original</span>}
          {isStaff && <span className="text-[0.6rem] text-primary bg-primary/10 px-1.5 py-0.5 rounded">Staff</span>}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          {new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{message}</p>
      {attachments && attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
          {attachments.map((att, i) => (
            <a key={i} href={`${process.env.NEXT_PUBLIC_API_URL}/storage/${att}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-2">
              <Paperclip className="size-3" />{att.split('/').pop()}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
