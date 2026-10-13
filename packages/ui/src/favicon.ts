/**
 * Returns Next.js Metadata icons config pointing to the web app's favicon.
 * SSOT: favicon lives only in apps/web/public/favicon.png
 *
 * Usage in layout.tsx:
 *   import { getBrandIcons } from '@ahanesk/ui';
 *   export const metadata: Metadata = {
 *     ...getBrandIcons(process.env.NEXT_PUBLIC_WEB_URL),
 *   };
 */
export function getBrandIcons(webUrl?: string) {
  const base = webUrl
    ? webUrl.replace(/\/$/, '')
    : '';

  return {
    icons: {
      icon: `${base}/favicon.png`,
      shortcut: `${base}/favicon.png`,
      apple: `${base}/favicon.png`,
    },
  };
}

/**
 * Returns the canonical favicon URL.
 */
export function getFaviconUrl(webUrl?: string): string {
  const base = webUrl ? webUrl.replace(/\/$/, '') : '';
  return `${base}/favicon.png`;
}
