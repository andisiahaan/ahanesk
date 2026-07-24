'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Logo } from '@ahansk/ui';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ui/theme-toggle';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get('next') ?? (process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard');
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [twoFactor, setTwoFactor] = useState<{ partial: string } | null>(null);
  const [totpCode, setTotpCode] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { ...form, recaptchaToken: 'bypass-dev' });
      if (data.data.requiresTwoFactor) {
        setTwoFactor({ partial: data.data.partialToken });
      } else {
        await fetchMe();
        toast.success('Welcome back!');
        router.push(nextUrl);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/2fa/verify', { partialToken: twoFactor!.partial, code: totpCode });
      await fetchMe();
      toast.success('Welcome back!');
      router.push(nextUrl);
    } catch { toast.error('Invalid 2FA code.'); }
    finally { setLoading(false); }
  };

  if (twoFactor) return (
    <form onSubmit={handleTotp} className="flex flex-col gap-4">
      <div>
        <Label>Authenticator Code</Label>
        <Input placeholder="000000" maxLength={6} value={totpCode}
          onChange={(e) => setTotpCode(e.target.value)} autoFocus />
      </div>
      <Button type="submit" loading={loading} className="w-full">Verify</Button>
      <button type="button" onClick={() => setTwoFactor(null)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center">
        ← Back to login
      </button>
    </form>
  );

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
      <div>
        <Label>Email</Label>
        <Input type="email" placeholder="you@example.com"
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" placeholder="••••••••"
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </div>
      <Button type="submit" loading={loading} className="w-full">Sign In</Button>
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
