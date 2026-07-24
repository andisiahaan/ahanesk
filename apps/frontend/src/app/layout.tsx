import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { getBrandIcons } from '@ahansk/ui';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { IntlProvider } from '@/providers/intl-provider';
import { Toaster } from '@/components/ui/toast';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: { default: 'My App', template: '%s | My App' },
  description: 'A production-ready full-stack starter kit',
  ...getBrandIcons(process.env.NEXT_PUBLIC_FRONTEND_URL),
};

export const dynamic = 'force-dynamic';

// Script dijalankan sebelum React hydrate — mencegah flash of wrong theme
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

import { cookies } from 'next/headers';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get('access_token')?.value;

  return (
    <html lang={locale} className={geist.variable} suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: tema diterapkan sebelum render pertama */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <IntlProvider locale={locale} messages={messages}>
          <QueryProvider>
            <ThemeProvider>
              <AuthProvider isLoggedIn={isLoggedIn}>
                {children}
                <Toaster />
              </AuthProvider>
            </ThemeProvider>
          </QueryProvider>
        </IntlProvider>
      </body>
    </html>
  );
}
