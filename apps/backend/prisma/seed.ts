import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import {
  SETTING_KEYS,
  DEFAULT_APP_SETTINGS,
  DEFAULT_AUTH_SETTINGS,
} from '@ahansk/shared';
import { hash } from 'argon2';
import 'dotenv/config';

// ─── Prisma Setup ─────────────────────────────────────────────────────────────

function createPrisma(): PrismaClient {
  const url = new URL(process.env.DATABASE_URL!);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: parseInt(url.port || '3306', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

const prisma = createPrisma();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) { console.log(msg); }

// ─── Settings ─────────────────────────────────────────────────────────────────

async function seedSettings() {
  log('\n📦 Settings');
  const rows = [
    { key: SETTING_KEYS.APP,  settings: DEFAULT_APP_SETTINGS  },
    { key: SETTING_KEYS.AUTH, settings: DEFAULT_AUTH_SETTINGS },
  ];
  for (const { key, settings } of rows) {
    const json = settings as unknown as Parameters<typeof prisma.setting.create>[0]['data']['settings'];
    await prisma.setting.upsert({
      where: { key },
      create: { key, settings: json },
      update: {}, // never overwrite existing — only seed if missing
    });
    log(`  ✅ settings[${key}]`);
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────

async function seedUsers() {
  log('\n👤 Users');

  const adminPw = await hash('ahandev');
  const userPw  = await hash('ahandev');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ahandev.com' },
    create: {
      email: 'admin@ahandev.com',
      password: adminPw,
      name: 'Super Admin',
      role: 'ADMIN',
      is_active: true,
      email_verified_at: new Date(),
    },
    update: {
      password: adminPw,
      role: 'ADMIN',
      email_verified_at: new Date(),
    },
  });
  log(`  ✅ admin@ahandev.com  (role: ADMIN, pw: ahandev)`);

  const user = await prisma.user.upsert({
    where: { email: 'user@ahandev.com' },
    create: {
      email: 'user@ahandev.com',
      password: userPw,
      name: 'John Doe',
      role: 'USER',
      is_active: true,
      email_verified_at: new Date(),
    },
    update: {
      password: userPw,
    },
  });
  log(`  ✅ user@ahandev.com   (role: USER, pw: ahandev)`);

  return { admin, user };
}

// ─── Pages ────────────────────────────────────────────────────────────────────

async function seedPages() {
  log('\n📄 Pages');

  const pages = [
    {
      slug: 'about',
      title: 'About Us',
      meta_description: 'Learn more about our platform and team.',
      is_published: true,
      published_at: new Date(),
      content: `<h1>About Us</h1>
<p>Welcome to our platform. We build modern, production-ready web applications using the latest technologies.</p>
<h2>Our Stack</h2>
<ul>
  <li><strong>Backend:</strong> NestJS, Prisma, MariaDB, Redis</li>
  <li><strong>Frontend:</strong> Next.js App Router, TypeScript, Tailwind CSS</li>
  <li><strong>Auth:</strong> JWT, Google OAuth, 2FA TOTP</li>
  <li><strong>Infra:</strong> pnpm Monorepo, Turborepo</li>
</ul>`,
    },
    {
      slug: 'terms',
      title: 'Terms of Service',
      meta_description: 'Read our terms and conditions before using the platform.',
      is_published: true,
      published_at: new Date(),
      content: `<h1>Terms of Service</h1>
<p>By using this platform, you agree to the following terms and conditions.</p>
<h2>1. Acceptance</h2>
<p>By accessing this service, you accept these terms in full. If you disagree, please do not use the service.</p>
<h2>2. Use License</h2>
<p>Permission is granted to use this platform for personal and commercial purposes, subject to these terms.</p>
<h2>3. Disclaimer</h2>
<p>The platform is provided "as is" without warranties of any kind.</p>`,
    },
    {
      slug: 'privacy',
      title: 'Privacy Policy',
      meta_description: 'Understand how we collect and process your personal data.',
      is_published: true,
      published_at: new Date(),
      content: `<h1>Privacy Policy</h1>
<p>This policy explains how we collect, use, and protect your personal information.</p>
<h2>Data We Collect</h2>
<ul>
  <li>Email address and name (for account creation)</li>
  <li>Login activity (for security monitoring)</li>
  <li>Browser information (for analytics and security)</li>
</ul>
<h2>How We Use Your Data</h2>
<p>We use your data only to provide and improve our services. We never sell personal data to third parties.</p>
<h2>Contact</h2>
<p>For privacy questions, contact us at privacy@example.com</p>`,
    },
    {
      slug: 'contact',
      title: 'Contact Us',
      meta_description: 'Get in touch with our support team.',
      is_published: true,
      published_at: new Date(),
      content: `<h1>Contact Us</h1>
<p>We would love to hear from you. Reach us through any of the following channels:</p>
<h2>Support</h2>
<p>Email: <strong>support@example.com</strong></p>
<p>Response time: within 24 business hours.</p>
<h2>Business Inquiries</h2>
<p>Email: <strong>business@example.com</strong></p>`,
    },
    {
      slug: 'changelog',
      title: 'Changelog',
      meta_description: 'See what has changed in each version of the platform.',
      is_published: false,
      published_at: null,
      content: `<h1>Changelog</h1>
<h2>v1.0.0 — Initial Release</h2>
<ul>
  <li>Full authentication system (JWT, Google OAuth, 2FA)</li>
  <li>Admin panel with user management</li>
  <li>Rich text page editor (TipTap)</li>
  <li>Settings management</li>
  <li>File storage (local + S3-compatible)</li>
</ul>`,
    },
  ];

  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      create: page,
      update: {},
    });
    const status = page.is_published ? '🟢 published' : '⚪ draft';
    log(`  ✅ /${page.slug}  (${status})`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  log('🌱 Seeding database...');

  await seedSettings();
  await seedUsers();
  await seedPages();

  log('\n✅ Seeding complete!\n');
  log('   Admin login: admin@ahandev.com / ahandev');
  log('   User  login: user@ahandev.com  / ahandev');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => { void prisma.$disconnect(); });
