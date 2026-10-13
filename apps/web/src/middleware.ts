import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/i18n/request';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

const DASHBOARD_PATH = process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard';

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('access_token')?.value;

  const isPublic   = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isDashboard = pathname === DASHBOARD_PATH || pathname.startsWith(DASHBOARD_PATH + '/');

  // Protect dashboard routes — redirect unauthenticated users to login
  if (isDashboard && !token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from auth pages
  if (isPublic && token && ['/login', '/register'].includes(pathname)) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, req.url));
  }

  // ─── Set locale cookie if missing ──────────────────────────────────────────
  const response = NextResponse.next();
  if (!req.cookies.has('locale')) {
    const acceptLang = req.headers.get('accept-language') ?? '';
    const preferred = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase() ?? '';
    const locale = (SUPPORTED_LOCALES as readonly string[]).includes(preferred)
      ? preferred
      : DEFAULT_LOCALE;
    response.cookies.set('locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
