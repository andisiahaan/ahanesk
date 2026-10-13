import { en } from './en/index';

/**
 * Central locale registry for all supported locales.
 *
 * To add a new language (e.g. Indonesian):
 *  1. Create `packages/shared/src/locales/id/` with the same folder structure (modules/, web/, admin/)
 *  2. Create `packages/shared/src/locales/id/index.ts` re-exporting all files
 *  3. Add `id` to this registry and to SUPPORTED_LOCALES in each app's i18n/request.ts
 */
export const localeRegistry = { en } as const;

export type SupportedLocale = keyof typeof localeRegistry;
export type LocaleData = (typeof localeRegistry)[SupportedLocale];
