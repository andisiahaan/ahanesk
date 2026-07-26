'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/lib/api';
import { Logo } from '@ahansk/ui';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { RegisterSchema, type RegisterDto } from '@ahansk/shared';

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get('next') ?? (process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterDto>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (data: RegisterDto) => {
    try {
      await api.post('/auth/register', { ...data, recaptchaToken: 'bypass-dev' });
      toast.success('Account created! Please check your email to verify.');
      setTimeout(() => router.push(`/login?next=${nextUrl}`), 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Registration failed.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Full Name</Label>
        <Input placeholder="Jane Doe" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Email</Label>
        <Input type="email" placeholder="you@example.com" {...register('email')} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Password</Label>
        <Input type="password" placeholder="Min 8 characters" {...register('password')} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <div className="flex items-start gap-2 mt-2">
        <input type="checkbox" id="terms" required className="mt-1 accent-primary" />
        <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
          I agree to the <Link href="/pages/terms" target="_blank" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/pages/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>.
        </label>
      </div>
      <Button type="submit" loading={isSubmitting} className="w-full">Create Account</Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href={`/login?next=${nextUrl}`} className="text-primary hover:underline">Sign in</Link>
      </p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-4 bg-background">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 shadow-lg">
        <div className="text-center mb-8">
          <Logo width={120} height={32} className="mx-auto mb-5" />
          <h1 className="text-2xl font-bold text-foreground">Create account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join us today</p>
        </div>
        <Suspense fallback={null}><RegisterForm /></Suspense>
      </div>
    </main>
  );
}
