import { getTranslations } from 'next-intl/server';
import { NotificationPreferencesForm } from './preferences-form';

export const metadata = { title: 'Notification Preferences' };

export default async function NotificationPreferencesPage() {
  const t = await getTranslations('notifications');
  return (
    <div className="max-w-2xl space-y-6 mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('preferences.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('preferences.channelSection')}</p>
      </div>
      <NotificationPreferencesForm />
    </div>
  );
}
