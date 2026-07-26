'use client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, LifeBuoy } from 'lucide-react';
import api from '@/lib/api';
import { CreateTicketSchema } from '@ahansk/shared';
import type { z } from 'zod';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type TicketFormValues = z.input<typeof CreateTicketSchema>;

const dashboardPath = process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard';

const PRIORITIES = [
  { value: 'LOW',    label: 'Low',    desc: 'General questions' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Functional issues' },
  { value: 'HIGH',   label: 'High',   desc: 'Significant impact' },
  { value: 'URGENT', label: 'Urgent', desc: 'Service down' },
] as const;

export default function NewTicketPage() {
  const router = useRouter();
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<TicketFormValues>({
    resolver: zodResolver(CreateTicketSchema),
    defaultValues: { priority: 'MEDIUM' },
  });
  const priority = watch('priority');

  const onSubmit = async (data: TicketFormValues) => {
    try {
      const res = await api.post('/tickets', data);
      toast.success('Ticket submitted! We\'ll get back to you shortly.');
      router.push(`${dashboardPath}/tickets/${res.data.data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to submit ticket.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="size-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <LifeBuoy className="size-6" /> Open Support Ticket
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Describe your issue and we&apos;ll help as soon as possible.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          {/* Subject */}
          <div className="flex flex-col gap-1.5">
            <Label>Subject <span className="text-destructive">*</span></Label>
            <Input placeholder="Brief summary of your issue" {...register('subject')} />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <Label>Category <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input placeholder="e.g. Billing, Account, Technical" {...register('category')} />
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-2">
            <Label>Priority</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setValue('priority', p.value, { shouldValidate: true })}
                  className={`flex flex-col gap-0.5 rounded-xl border p-3 text-left transition-all ${
                    priority === p.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-border/80 hover:text-foreground'
                  }`}
                >
                  <span className="text-xs font-bold">{p.label}</span>
                  <span className="text-[0.65rem] opacity-70 leading-tight">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label>Description <span className="text-destructive">*</span></Label>
            <textarea
              rows={6}
              placeholder="Describe your issue in detail — steps to reproduce, error messages, etc."
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} className="px-8">Submit Ticket</Button>
        </div>
      </form>
    </div>
  );
}
