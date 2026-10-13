'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Logo } from '@ahanesk/ui';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { RegisterSchema, type RegisterDto } from '@ahanesk/shared';
import { useAuthSettings } from '@/lib/use-auth-settings';
import { GoogleAuthButton } from '@/components/auth/google-auth-button';
import { isGoogleAuthClientConfigured } from '@/providers/google-auth-provider';

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get('next') ?? (process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard');
  const t = useTranslations('auth');

  const { data: settings } = useAuthSettings();
  const isRegistrationEnabled = settings?.is_registration_enabled ?? true;
  const isGoogleEnabled = settings?.is_google_auth_enabled ?? true;
  const showGoogleButton = isGoogleAuthClientConfigured && isGoogleEnabled;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterDto>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (data: RegisterDto) => {
    try {
      await api.post('/auth/register', { ...data, recaptchaToken: 'bypass-dev' });
      toast.success(t('register.success'));
      setTimeout(() => router.push(`/login?next=${nextUrl}`), 2000);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      const status = e?.response?.status;
      const msg = e?.response?.data?.message;
      if (status === 409) toast.error(msg ?? t('errors.invalidCredentials'));
      else toast.error(msg ?? t('register.googleFailed'));
    }
  };

  if (!isRegistrationEnabled) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-muted-foreground">{t('register.registrationDisabled')}</p>
        <Link href={`/login?next=${nextUrl}`} className="text-primary hover:underline text-sm font-medium">
          ← {t('register.signIn')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>{t('register.name')}</Label>
          <Input placeholder="Jane Doe" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t('register.email')}</Label>
          <Input type="email" placeholder="you@example.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t('register.password')}</Label>
          <Input type="password" placeholder="Min 8 characters" {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="flex items-start gap-2 mt-2">
          <input type="checkbox" id="terms" required className="mt-1 accent-primary" />
          <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
            I agree to the <Link href="/pages/terms" target="_blank" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/pages/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>.
          </label>
        </div>
        <Button type="submit" loading={isSubmitting} className="w-full">{t('register.submit')}</Button>
        <p className="text-center text-sm text-muted-foreground">
          {t('register.haveAccount')}{' '}
          <Link href={`/login?next=${nextUrl}`} className="text-primary hover:underline">{t('register.signIn')}</Link>
        </p>
      </form>

      {showGoogleButton && (
        <div className="mt-6">
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground uppercase tracking-wider font-semibold">
                {t('register.orContinueWith')}
              </span>
            </div>
          </div>

          <GoogleAuthButton text="signup_with" onSuccessRedirect={nextUrl} />
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const t = useTranslations('auth');

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 bg-background">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 shadow-lg">
        <div className="text-center mb-8">
          <Logo width={120} height={32} className="mx-auto mb-5" />
          <h1 className="text-2xl font-bold text-foreground">{t('register.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('register.subtitle')}</p>
        </div>
        <Suspense fallback={null}><RegisterForm /></Suspense>
      </div>
    </main>
  );
}
