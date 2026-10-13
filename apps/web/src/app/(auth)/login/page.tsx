'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { LoginSchema, type LoginDto } from '@ahanesk/shared';
import { Logo } from '@ahanesk/ui';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthSettings } from '@/lib/use-auth-settings';
import { GoogleAuthButton } from '@/components/auth/google-auth-button';
import { isGoogleAuthClientConfigured } from '@/providers/google-auth-provider';

// ─── TOTP sub-form ─────────────────────────────────────────────────────────────
const TotpSchema = z.object({ code: z.string().min(6).max(11, 'Invalid code format') });
type TotpValues = z.infer<typeof TotpSchema>;

interface TotpFormProps { partial: string; onBack: () => void; }

function TotpForm({ partial, onBack }: TotpFormProps) {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get('next') ?? (process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard');
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const t = useTranslations('auth');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TotpValues>({
    resolver: zodResolver(TotpSchema),
  });

  const onSubmit = async ({ code }: TotpValues) => {
    try {
      await api.post('/auth/2fa/verify', { partialToken: partial, code });
      await fetchMe();
      toast.success(t('login.title'));
      router.push(nextUrl);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('errors.twoFactorInvalid'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <Label>{t('twoFactor.code')}</Label>
        <Input placeholder="000000 or XXXXX-YYYYY" maxLength={11} autoFocus {...register('code')} />
        {errors.code && <p className="text-xs text-destructive mt-1">{errors.code.message}</p>}
      </div>
      <Button type="submit" loading={isSubmitting} className="w-full">{t('twoFactor.submit')}</Button>
      <button type="button" onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center">
        ← {t('forgotPassword.backToLogin')}
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
  const t = useTranslations('auth');
  const [twoFactor, setTwoFactor] = useState<{ partial: string } | null>(null);

  const { data: settings } = useAuthSettings();
  const isGoogleEnabled = settings?.is_google_auth_enabled ?? true;
  const showGoogleButton = isGoogleAuthClientConfigured && isGoogleEnabled;

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
        toast.success(t('login.title'));
        router.push(nextUrl);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('errors.invalidCredentials'));
    }
  };

  if (twoFactor) return <TotpForm partial={twoFactor.partial} onBack={() => setTwoFactor(null)} />;

  return (
    <div className="flex flex-col">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <Label>{t('login.email')}</Label>
          <Input type="email" placeholder="you@example.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label>{t('login.password')}</Label>
          <Input type="password" placeholder="••••••••" {...register('password')} />
          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
        </div>
        <Button type="submit" loading={isSubmitting} className="w-full">{t('login.submit')}</Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/forgot-password" className="text-primary hover:underline">{t('login.forgotPassword')}</Link>
          {settings?.is_registration_enabled !== false && (
            <>
              {' · '}
              <Link href={`/register${nextUrl !== (process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard') ? `?next=${nextUrl}` : ''}`}
                className="text-primary hover:underline">{t('login.signUp')}</Link>
            </>
          )}
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
                {t('login.orContinueWith')}
              </span>
            </div>
          </div>

          <GoogleAuthButton
            text="continue_with"
            onSuccessRedirect={nextUrl}
            onRequiresTwoFactor={(partial) => setTwoFactor({ partial })}
          />
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  const t = useTranslations('auth');

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 bg-background">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 shadow-lg">
        <div className="text-center mb-8">
          <Logo width={120} height={32} className="mx-auto mb-5" />
          <h1 className="text-2xl font-bold text-foreground">{t('login.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('login.subtitle')}</p>
        </div>
        <Suspense fallback={null}><LoginForm /></Suspense>
      </div>
    </main>
  );
}
