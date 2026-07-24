import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Shield, Bell, User } from 'lucide-react';

export const metadata = { title: 'Settings' };

const dashboardPath = process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard';

export default async function SettingsPage() {
  const t = await getTranslations('nav');

  return (
    <div className="max-w-2xl space-y-8 mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('settings')}</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account preferences and settings.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href={`${dashboardPath}/settings/profile`}
          className="group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 hover:border-primary/40 hover:bg-primary/5 transition-all">
          <div className="size-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
            <User className="size-5 text-violet-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Profile</p>
            <p className="text-xs text-muted-foreground">Name, avatar & phone</p>
          </div>
        </Link>

        <Link href={`${dashboardPath}/settings/notifications`}
          className="group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 hover:border-primary/40 hover:bg-primary/5 transition-all">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bell className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t('notifications')}</p>
            <p className="text-xs text-muted-foreground">Channels & notification types</p>
          </div>
        </Link>

        <Link href={`${dashboardPath}/settings/security`}
          className="group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 hover:border-primary/40 hover:bg-primary/5 transition-all">
          <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Shield className="size-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t('security')}</p>
            <p className="text-xs text-muted-foreground">Password, email & 2FA</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
