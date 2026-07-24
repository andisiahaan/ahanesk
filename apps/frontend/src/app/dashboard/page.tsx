import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Shield, ArrowRight,
  Code2, Database, Globe2, Zap, ShieldCheck, Package,
  Newspaper, Calendar,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export const metadata = { title: 'Dashboard' };

interface Me { name: string; email: string; role: string; createdAt: string; }
interface NewsItem { id: string; title: string; slug: string; type: string; published_at: string | null; }

async function getMe(): Promise<Me | null> {
  try {
    const res = await apiFetch('/users/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.data ?? null;
  } catch { return null; }
}

async function getUnreadCount(): Promise<number> {
  try {
    const res = await apiFetch('/notifications?isRead=false&limit=1');
    if (!res.ok) return 0;
    const data = await res.json();
    return data.meta?.total ?? 0;
  } catch { return 0; }
}

async function getLatestNews(): Promise<NewsItem[]> {
  try {
    const res = await apiFetch('/news?limit=2&page=1');
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.items ?? [];
  } catch { return []; }
}

const STACK = [
  { icon: <Code2 className="size-5 text-primary" />,         label: 'NestJS',    desc: 'Backend API' },
  { icon: <Globe2 className="size-5 text-blue-500" />,       label: 'Next.js 16', desc: 'Frontend & Admin' },
  { icon: <Database className="size-5 text-emerald-500" />,  label: 'Prisma',    desc: 'ORM + MySQL' },
  { icon: <Zap className="size-5 text-yellow-500" />,        label: 'Redis',     desc: 'Cache & Queue' },
  { icon: <ShieldCheck className="size-5 text-violet-500" />, label: 'JWT + 2FA', desc: 'Auth' },
  { icon: <Package className="size-5 text-orange-500" />,    label: 'pnpm Monorepo', desc: 'Turborepo' },
];

const TYPE_STYLES: Record<string, string> = {
  ANNOUNCEMENT: 'bg-primary/10 text-primary',
  UPDATE:       'bg-emerald-500/10 text-emerald-600',
  MAINTENANCE:  'bg-destructive/10 text-destructive',
};

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');
  const [me, unread, news] = await Promise.all([getMe(), getUnreadCount(), getLatestNews()]);
  const dashboardPath = process.env.NEXT_PUBLIC_DASHBOARD_PATH ?? '/dashboard';

  if (!me) {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) redirect(`/login?next=${dashboardPath}`);
  }

  const memberSince = me?.createdAt
    ? new Date(me.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '—';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t('welcome', { name: me?.name ?? 'there' })}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('welcomeDesc')}</h1>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary capitalize">
            <LayoutDashboard className="size-3" />
            {me?.role?.toLowerCase() ?? 'user'}
          </span>
        </div>
      </div>

      {/* Latest News */}
      {news.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Newspaper className="size-4" /> {t('latestNews')}
            </h2>
            <Link href={`${dashboardPath}/news`}
              className="text-xs text-primary hover:underline font-medium">{t('viewAllNews')}</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {news.map((item) => (
              <Link
                key={item.id}
                href={`${dashboardPath}/news/${item.slug}`}
                className="group flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3.5 hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <span className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full ${TYPE_STYLES[item.type] ?? 'bg-muted text-muted-foreground'}`}>
                    {item.type.toLowerCase()}
                  </span>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors mt-1 truncate">{item.title}</p>
                  {item.published_at && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Calendar className="size-2.5" />
                      {new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          {
            label: t('stats.unreadNotifications'),
            value: unread,
            icon:  <Shield className="size-5 text-primary" />,
            href:  null,
          },
          {
            label: t('stats.memberSince'),
            value: memberSince,
            icon:  <ShieldCheck className="size-5 text-emerald-500" />,
            href:  null,
          },
        ].map((stat, i) => (
          <div key={i} className="col-span-1 rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-xl bg-muted flex items-center justify-center">{stat.icon}</div>
              {stat.href && (
                <Link href={stat.href} className="text-xs text-primary hover:underline">View</Link>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">{t('quickActions')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: t('actions.editProfile'),  href: `${dashboardPath}/settings/profile`,  icon: <LayoutDashboard className="size-4" /> },
            { label: t('actions.security'),     href: `${dashboardPath}/settings/security`, icon: <Shield className="size-4" /> },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-4 text-sm font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground group-hover:text-primary transition-colors">{action.icon}</span>
                {action.label}
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </section>

      {/* Stack Showcase */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">{t('stack.title')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t('stack.desc')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STACK.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center hover:border-primary/30 transition-colors">
              <div className="size-10 rounded-xl bg-muted flex items-center justify-center">{item.icon}</div>
              <p className="text-xs font-semibold text-foreground">{item.label}</p>
              <p className="text-[0.6rem] text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
