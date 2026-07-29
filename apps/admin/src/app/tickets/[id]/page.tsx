'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UPLOAD_CONFIGS } from '@ahanesk/shared';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Reply { id: string; message: string; is_staff_reply: boolean; attachments: string[]; created_at: string; user: { name: string; role: string }; }
interface Ticket { id: string; ticket_number: string; subject: string; description: string; status: string; priority: string; category: string | null; user: { name: string; email: string }; assignee: { id: string; name: string } | null; replies: Reply[]; created_at: string; }

const STATUSES   = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const cfg = UPLOAD_CONFIGS.ticket_attachment;

export default function TicketDetailPage() {
  const { id }  = useParams() as { id: string };
  const router  = useRouter();
  const [ticket, setTicket]     = useState<Ticket | null>(null);
  const [reply, setReply]       = useState('');
  const [status, setStatus]     = useState('');
  const [priority, setPriority] = useState('');
  const [files, setFiles]       = useState<File[]>([]);
  const [saving, setSaving]     = useState(false);
  const [sending, setSending]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data } = await api.get(`/admin/tickets/${id}`);
    const t = data.data;
    setTicket(t); setStatus(t.status); setPriority(t.priority);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const update = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/tickets/${id}`, { status, priority });
      toast.success('Ticket updated.'); await load();
    } catch { toast.error('Failed to update.'); }
    finally { setSaving(false); }
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files, ...Array.from(incoming)];
    if (next.length > cfg.maxFiles) { toast.error(`Max ${cfg.maxFiles} attachments.`); return; }
    const invalid = Array.from(incoming).find((f) => !(cfg.allowedMimeTypes as readonly string[]).includes(f.type));
    if (invalid) { toast.error(`${invalid.name}: unsupported type.`); return; }
    const oversized = Array.from(incoming).find((f) => f.size > cfg.maxSizeBytes);
    if (oversized) { toast.error(`${oversized.name} exceeds ${cfg.maxSizeBytes / 1024 / 1024} MB.`); return; }
    setFiles(next);
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('message', reply);
      files.forEach((f) => fd.append(cfg.fieldName, f));
      await api.post(`/admin/tickets/${id}/reply`, fd);
      setReply(''); setFiles([]); await load(); toast.success('Reply sent.');
    } catch { toast.error('Failed to send reply.'); }
    finally { setSending(false); }
  };

  if (!ticket) return <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>;

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">{ticket.ticket_number}</h1>
        <Button variant="outline" size="sm" onClick={() => router.push('/tickets')}>← Back</Button>
      </div>

      <div className="border border-border rounded-xl p-5 bg-card mb-5 space-y-1">
        <p className="text-lg font-semibold text-foreground">{ticket.subject}</p>
        <p className="text-sm text-muted-foreground">From: {ticket.user.name} ({ticket.user.email})</p>
        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{ticket.description}</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex flex-col gap-1 min-w-[120px]">
          <Label className="text-xs">Status</Label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="h-8 rounded-lg border border-border bg-card px-2 text-sm text-foreground">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 min-w-[120px]">
          <Label className="text-xs">Priority</Label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}
            className="h-8 rounded-lg border border-border bg-card px-2 text-sm text-foreground">
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex items-end"><Button onClick={update} loading={saving} size="sm">Save</Button></div>
      </div>

      {/* Replies */}
      <div className="space-y-3 mb-6">
        {ticket.replies.map((r) => (
          <div key={r.id} className={cn('rounded-xl p-4 text-sm', r.is_staff_reply ? 'bg-primary/8 border border-primary/20' : 'bg-muted border border-border')}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-foreground">{r.user.name}</span>
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <p className="text-foreground whitespace-pre-wrap">{r.message}</p>
            {r.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {r.attachments.map((att, i) => (
                  <a key={i} href={`${process.env.NEXT_PUBLIC_API_URL}/storage/${att}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2">
                    <Paperclip className="size-3" />{att.split('/').pop()}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reply form */}
      <div className="border border-border rounded-xl p-4 bg-card flex flex-col gap-3">
        <Label>Staff Reply</Label>
        <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4}
          placeholder="Write your reply…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" />

        <div className="flex flex-col gap-2">
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
            <Paperclip className="size-4" />
            Attach files
            <span className="text-xs opacity-70">
              ({files.length}/{cfg.maxFiles} · max {cfg.maxSizeBytes / 1024 / 1024} MB · {cfg.allowedExtensions.join(', ')})
            </span>
          </button>
          <input ref={fileInputRef} type="file" multiple accept={cfg.allowedExtensions.join(',')}
            className="hidden" onChange={(e) => addFiles(e.target.files)} />
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <span key={i} className="flex items-center gap-1 bg-muted text-xs rounded-full px-2.5 py-1">
                  {f.name}
                  <button onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))} className="hover:text-destructive ml-0.5">
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <Button onClick={sendReply} loading={sending} className="w-fit">Send Reply</Button>
      </div>
    </div>
  );
}
