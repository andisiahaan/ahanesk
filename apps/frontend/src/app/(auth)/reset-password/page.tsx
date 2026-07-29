'use client';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { Logo } from '@ahanesk/ui';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Frontend-only schema — confirm field tidak ada di shared schema
const ResetPasswordFormSchema = z.object({
  password: z.string().min(8).max(128),
  confirm:  z.string().min(1),
}).refine((d: { password: string; confirm: string }) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});
type ResetPasswordFormValues = z.infer<typeof ResetPasswordFormSchema>;

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(ResetPasswordFormSchema),
  });

  const onSubmit = async ({ password }: ResetPasswordFormValues) => {
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password reset! Redirecting to login…');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Reset failed. Token may have expired.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>New Password</Label>
        <Input type="password" placeholder="Min 8 characters" {...register('password')} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Confirm Password</Label>
        <Input type="password" placeholder="••••••••" {...register('confirm')} />
        {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
      </div>
      <Button type="submit" loading={isSubmitting} className="w-full">Reset Password</Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 shadow-lg">
        <div className="text-center mb-8">
          <Logo width={120} height={32} className="mx-auto mb-5" />
          <h1 className="text-2xl font-bold text-foreground">New password</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose a strong password</p>
        </div>
        <Suspense fallback={<p className="text-center text-sm text-muted-foreground">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
