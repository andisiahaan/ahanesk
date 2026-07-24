'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';
import api from '@/lib/api';
import {
  getUserNotificationTypes, getNotificationCategory,
  isSecurityCritical, NOTIFICATION_CATEGORIES,
  NOTIFICATION_CHANNELS, REQUIRED_CHANNELS,
  type NotificationPreferences, type NotificationCategory, type NotificationType
} from '@ahansk/shared';

async function fetchPrefs(): Promise<NotificationPreferences> {
  const res = await api.get<{ data: NotificationPreferences }>('/notifications/preferences');
  return res.data.data;
}

async function savePrefs(prefs: NotificationPreferences): Promise<void> {
  await api.patch('/notifications/preferences', prefs);
}

const USER_TYPES = getUserNotificationTypes();

export function NotificationPreferencesForm() {
  const t  = useTranslations('notifications');
  const qc = useQueryClient();

  const { data: prefs, isLoading } = useQuery({ queryKey: ['notification-prefs'], queryFn: fetchPrefs });

  const mutation = useMutation({
    mutationFn: savePrefs,
    onSuccess:  () => void qc.invalidateQueries({ queryKey: ['notification-prefs'] }),
  });

  const toggle = (key: 'types' | 'channels', field: string, current: boolean) => {
    if (!prefs) return;
    const updated: NotificationPreferences = {
      types:    { ...prefs.types },
      channels: { ...prefs.channels },
    };
    if (key === 'types')    updated.types[field as keyof typeof updated.types]       = !current;
    if (key === 'channels') updated.channels[field as keyof typeof updated.channels] = !current;
    mutation.mutate(updated);
  };

  if (isLoading) return <div className="space-y-4">{[...Array<undefined>(4)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}</div>;

  const channelEnabled = (ch: string): boolean => prefs?.channels[ch as keyof typeof prefs.channels] ?? true;
  const typeEnabled    = (tp: string): boolean => prefs?.types[tp    as keyof typeof prefs.types]    ?? true;

  const groupedByCategory = NOTIFICATION_CATEGORIES.reduce<Record<string, NotificationType[]>>((acc, cat) => {
    acc[cat] = USER_TYPES.filter(tp => getNotificationCategory(tp) === cat);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Channel toggles */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-4">{t('preferences.channelSection')}</h2>
        <div className="space-y-3">
          {NOTIFICATION_CHANNELS.map((ch) => {
            const isRequired = REQUIRED_CHANNELS.includes(ch);
            const enabled    = isRequired || channelEnabled(ch);
            return (
              <label key={ch} className={`flex items-center justify-between p-4 rounded-xl border border-border bg-card ${isRequired ? 'opacity-70' : 'cursor-pointer hover:bg-muted/50'}`}>
                <div>
                  <p className="text-sm font-medium text-foreground capitalize">{t(`channels.${ch}`)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isRequired && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                  <button
                    role="switch"
                    aria-checked={enabled}
                    disabled={isRequired}
                    onClick={() => !isRequired && toggle('channels', ch, enabled)}
                    className={`w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-muted'} disabled:cursor-not-allowed`}
                  >
                    <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform mx-1 ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      {/* Type toggles */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-4">{t('preferences.typeSection')}</h2>
        <div className="space-y-6">
          {(Object.entries(groupedByCategory) as [NotificationCategory, NotificationType[]][])
            .filter(([, types]) => types.length > 0)
            .map(([cat, types]) => (
              <div key={cat}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 capitalize">{t(`categories.${cat}`)}</p>
                <div className="space-y-2">
                  {types.map((tp) => {
                    const critical = isSecurityCritical(tp);
                    const enabled  = critical || typeEnabled(tp);
                    const labelKey = tp.replace('.', '_') as never;
                    return (
                      <label key={tp} className={`flex items-center justify-between p-3 rounded-lg border border-border bg-card ${critical ? 'opacity-70' : 'cursor-pointer hover:bg-muted/50'}`}>
                        <div>
                          <p className="text-sm text-foreground">{t(`types.${labelKey}`)}</p>
                          {critical && <p className="text-xs text-muted-foreground">{t('securityCriticalLabel')}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {critical && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                          <button
                            role="switch"
                            aria-checked={enabled}
                            disabled={critical}
                            onClick={() => !critical && toggle('types', tp, enabled)}
                            className={`w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-muted'} disabled:cursor-not-allowed`}
                          >
                            <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform mx-1 ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </section>

      {mutation.isSuccess && <p className="text-sm text-primary">{t('preferences.saved')}</p>}
    </div>
  );
}
