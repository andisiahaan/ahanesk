import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Shield, Bell, User, KeyRound } from 'lucide-react';

export const metadata = { title: 'Account Overview' };

const dashboardPath = process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard';

export default async function AccountPage() {
  const t = await getTranslations('account');

  return (
    <div className="max-w-3xl space-y-8 mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href={`${dashboardPath}/account/profile`}
          className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:bg-primary/5 transition-all">
          <div className="size-11 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
            <User className="size-5 text-violet-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{t('profile.title')}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('profile.description')}</p>
          </div>
        </Link>

        <Link href={`${dashboardPath}/account/security`}
          className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all">
          <div className="size-11 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Shield className="size-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{t('security.title')}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('security.description')}</p>
          </div>
        </Link>

        <Link href={`${dashboardPath}/account/notification-preferences`}
          className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all">
          <div className="size-11 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Bell className="size-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{t('notifications.title')}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('notifications.description')}</p>
          </div>
        </Link>

        <Link href={`${dashboardPath}/account/personal-access-tokens`}
          className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all">
          <div className="size-11 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <KeyRound className="size-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{t('apiKeys.title')}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('apiKeys.description')}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
