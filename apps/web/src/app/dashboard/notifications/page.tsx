import { getTranslations } from 'next-intl/server';
import { NotificationsList } from './notifications-list';

export const metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const t = await getTranslations('notifications');
  return (
    <div className="max-w-2xl space-y-6 mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('preferences.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage and track your notifications.</p>
      </div>
      <NotificationsList />
    </div>
  );
}
