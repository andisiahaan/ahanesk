import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { localeRegistry, type SupportedLocale } from '@ahanesk/shared';

export const SUPPORTED_LOCALES = Object.keys(localeRegistry) as SupportedLocale[];
export const DEFAULT_LOCALE: SupportedLocale = 'en';
export type Locale = SupportedLocale;

/**
 * Builds the next-intl message tree for the admin app.
 *
 * Locale is resolved from the `locale` cookie (set by middleware).
 * Messages are merged from two layers — both sourced from packages/shared:
 *
 *  • localeData.modules.*  — cross-app strings (identical in all apps)
 *  • localeData.admin.*    — strings specific to the admin dashboard app
 *
 * Adding a new locale: add it to localeRegistry in packages/shared/src/locales/index.ts.
 * Adding a new namespace: add JSON to the correct layer and wire it here.
 */
export default getRequestConfig(async () => {
  let locale: Locale = DEFAULT_LOCALE;
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('locale')?.value;
    if ((SUPPORTED_LOCALES as string[]).includes(raw ?? '')) {
      locale = raw as Locale;
    }
  } catch (err) {
    // cookies() throws in static pages like not-found
  }

  const { modules, admin } = localeRegistry[locale];

  return {
    locale,
    messages: {
      // ── Cross-app modules ──────────────────────────────────────────────
      auth:   modules.auth,
      common: modules.common,
      // Blog: shared field labels + admin management-context strings
      blog: { ...modules.blog, ...admin.blog },
      // Notifications: shared type labels + admin broadcast/settings strings
      notifications: { ...modules.notifications, ...admin.notifications },
      // ── Admin-specific ─────────────────────────────────────────────────
      nav:       admin.nav,
      dashboard: admin.dashboard,
      users:     admin.users,
      news:      admin.news,
      settings:  admin.settings,
      help:      admin.help,
    },
  };
});
