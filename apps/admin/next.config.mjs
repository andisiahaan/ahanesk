import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

/** @type {import('next').NextConfig} */
const config = {
  basePath: process.env.NEXT_BASE_PATH || '',
  transpilePackages: ['@ahansk/ui', '@ahansk/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
    unoptimized: process.env.NODE_ENV !== 'production',
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  turbopack: {
    resolveAlias: {
      'next-intl/config': './src/i18n/request.ts',
    }
  }
};

const nextConfig = withNextIntl(config);

if (nextConfig.experimental && nextConfig.experimental.turbo) {
  delete nextConfig.experimental.turbo;
  if (Object.keys(nextConfig.experimental).length === 0) {
    delete nextConfig.experimental;
  }
}

export default nextConfig;
