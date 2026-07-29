/**
 * Returns Next.js Metadata icons config pointing to the frontend's favicon.
 * SSOT: favicon lives only in apps/frontend/public/favicon.png
 *
 * Usage in layout.tsx:
 *   import { getBrandIcons } from '@ahanesk/ui';
 *   export const metadata: Metadata = {
 *     ...getBrandIcons(process.env.NEXT_PUBLIC_FRONTEND_URL),
 *   };
 */
export function getBrandIcons(frontendUrl?: string) {
  const base = frontendUrl
    ? frontendUrl.replace(/\/$/, '')
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
export function getFaviconUrl(frontendUrl?: string): string {
  const base = frontendUrl ? frontendUrl.replace(/\/$/, '') : '';
  return `${base}/favicon.png`;
}
