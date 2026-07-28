import Link from 'next/link';
import { Logo } from '@ahansk/ui';

const FOOTER_LINKS = {
  Features: [
    { label: 'Blog', href: '/blog' },
    { label: 'Categories', href: '/blog/categories' },
    { label: 'Tags', href: '/blog/tags' },
    { label: 'Help Center', href: '/help' },
  ],
  Account: [
    { label: 'Dashboard', href: '/dashboard/account' },
    { label: 'Profile Settings', href: '/dashboard/account/profile' },
    { label: 'Security', href: '/dashboard/account/security' },
    { label: 'Sign In', href: '/login' },
  ],
  Company: [
    { label: 'About', href: '/pages/about' },
    { label: 'Contact', href: '/pages/contact' },
    { label: 'Changelog', href: '/pages/changelog' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/pages/privacy' },
    { label: 'Terms of Service', href: '/pages/terms' },
    { label: 'Cookie Policy', href: '/pages/cookie' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <Link href="/" className="inline-flex">
              <Logo height={32} />
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-[200px]">
              Production-ready full-stack starter kit.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                {group}
              </p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Ahansk. All rights reserved.</p>
          <p>Built with NestJS, Next.js & Prisma.</p>
        </div>
      </div>
    </footer>
  );
}
