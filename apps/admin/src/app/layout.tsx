import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { getBrandIcons } from '@ahanesk/ui';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/providers/theme-provider';
import { IntlProvider } from '@/providers/intl-provider';
import { AdminShell } from '@/components/admin-shell';
import { Toaster } from '@/components/ui/toast';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: { default: 'Admin Panel', template: '%s | Admin Panel' },
  description: 'Admin dashboard for the starter kit',
  ...getBrandIcons(process.env.NEXT_PUBLIC_ADMIN_URL),
};

export const dynamic = 'force-dynamic';

const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    var sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.classList.add(t || sys);
  } catch(e) {}
})();
`;

import { QueryProvider } from '@/providers/query-provider';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={geist.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <IntlProvider locale={locale} messages={messages}>
          <QueryProvider>
            <ThemeProvider>
              <AdminShell>{children}</AdminShell>
              <Toaster />
            </ThemeProvider>
          </QueryProvider>
        </IntlProvider>
      </body>
    </html>
  );
}
