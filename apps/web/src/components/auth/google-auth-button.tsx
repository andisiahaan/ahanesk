'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { useAuthStore } from '@/stores/auth.store';
import { useTheme } from '@/providers/theme-provider';
import { isGoogleAuthClientConfigured } from '@/providers/google-auth-provider';
import { cn } from '@/lib/cn';

interface GoogleAuthButtonProps {
  text?: 'continue_with' | 'signin_with' | 'signup_with' | 'signin';
  onSuccessRedirect?: string;
  onRequiresTwoFactor?: (partialToken: string) => void;
  className?: string;
}

export function GoogleAuthButton({
  text = 'continue_with',
  onSuccessRedirect = '/dashboard',
  onRequiresTwoFactor,
  className,
}: GoogleAuthButtonProps) {
  const router = useRouter();
  const t = useTranslations('auth');
  const { theme } = useTheme();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [loading, setLoading] = useState(false);

  if (!isGoogleAuthClientConfigured) {
    return null;
  }

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast.error(t('login.googleFailed'));
      return;
    }

    try {
      setLoading(true);
      const { data: res } = await api.post('/auth/google', {
        credential: credentialResponse.credential,
      });

      if (res.data?.requiresTwoFactor) {
        if (onRequiresTwoFactor) {
          onRequiresTwoFactor(res.data.partialToken);
        } else {
          toast.error(t('errors.twoFactorInvalid'));
        }
        return;
      }

      await fetchMe();
      toast.success(t('login.title'));
      router.push(onSuccessRedirect);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('login.googleFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleError = () => {
    toast.error(t('login.googleFailed'));
  };

  return (
    <div className={cn('flex flex-col items-center justify-center w-full relative', className)}>
      <div className={cn('w-full flex justify-center transition-opacity duration-200', loading && 'opacity-50 pointer-events-none')}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap
          theme={theme === 'dark' ? 'filled_black' : 'outline'}
          shape="pill"
          text={text}
        />
      </div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/60 rounded-full">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
