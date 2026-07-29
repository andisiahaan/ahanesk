'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { LoginSchema, type LoginDto } from '@ahanesk/shared';
import { Logo } from '@ahanesk/ui';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// ─── TOTP sub-form ─────────────────────────────────────────────────────────────
const TotpSchema = z.object({ code: z.string().min(6).max(11, 'Invalid code format') });
type TotpValues = z.infer<typeof TotpSchema>;

interface TotpFormProps { partial: string; onBack: () => void; }

function TotpForm({ partial, onBack }: TotpFormProps) {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get('next') ?? (process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard');
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TotpValues>({
    resolver: zodResolver(TotpSchema),
  });

  const onSubmit = async ({ code }: TotpValues) => {
    try {
      await api.post('/auth/2fa/verify', { partialToken: partial, code });
      await fetchMe();
      toast.success('Welcome back!');
      router.push(nextUrl);
    } catch {
      toast.error('Invalid 2FA code.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <Label>Authenticator or Recovery Code</Label>
        <Input placeholder="000000 or XXXXX-YYYYY" maxLength={11} autoFocus {...register('code')} />
        {errors.code && <p className="text-xs text-destructive mt-1">{errors.code.message}</p>}
      </div>
      <Button type="submit" loading={isSubmitting} className="w-full">Verify</Button>
      <button type="button" onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center">
        ← Back to login
      </button>
    </form>
  );
}

// ─── Login form ────────────────────────────────────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get('next') ?? (process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard');
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [twoFactor, setTwoFactor] = useState<{ partial: string } | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginDto) => {
    try {
      const { data: res } = await api.post('/auth/login', { ...data, recaptchaToken: 'bypass-dev' });
      if (res.data.requiresTwoFactor) {
        setTwoFactor({ partial: res.data.partialToken });
      } else {
        await fetchMe();
        toast.success('Welcome back!');
        router.push(nextUrl);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Login failed. Please try again.');
    }
  };

  if (twoFactor) return <TotpForm partial={twoFactor.partial} onBack={() => setTwoFactor(null)} />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <Label>Email</Label>
        <Input type="email" placeholder="you@example.com" {...register('email')} />
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" placeholder="••••••••" {...register('password')} />
        {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
      </div>
      <Button type="submit" loading={isSubmitting} className="w-full">Sign In</Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
        {' · '}
        <Link href={`/register${nextUrl !== (process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard') ? `?next=${nextUrl}` : ''}`}
          className="text-primary hover:underline">Create account</Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-4 bg-background">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 shadow-lg">
        <div className="text-center mb-8">
          <Logo width={120} height={32} className="mx-auto mb-5" />
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>
        <Suspense fallback={null}><LoginForm /></Suspense>
      </div>
    </main>
  );
}
