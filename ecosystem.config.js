/**
 * PM2 Ecosystem Config — Ahanesk Monorepo
 *
 * Usage:
 *   First deploy  : pm2 start ecosystem.config.js --env production
 *   Update        : pm2 reload ecosystem.config.js --env production
 *   Status        : pm2 status
 *   Logs          : pm2 logs [app-name]
 *   Save on reboot: pm2 save && pm2 startup
 */

const dotenv = require('dotenv');

// Load environment variables for each app explicitly
const apiEnv = dotenv.config({ path: './apps/api/.env' }).parsed || {};
const webEnv = dotenv.config({ path: './apps/web/.env' }).parsed || {};
const adminEnv = dotenv.config({ path: './apps/admin/.env' }).parsed || {};

module.exports = {
  apps: [
    // ─────────────────────────────────────────────────────────────
    // API Server  →  api.ahanesk.com
    // ─────────────────────────────────────────────────────────────
    {
      name:               'ahanesk-api',
      cwd:                './apps/api',
      script:             'dist/main.js',
      instances:          2,
      exec_mode:          'cluster',
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: apiEnv.PORT || 10321,
      },
    },

    // ─────────────────────────────────────────────────────────────
    // Web (User-Facing)  →  ahanesk.com  (or your domain)
    // ─────────────────────────────────────────────────────────────
    {
      name:               'ahanesk-web',
      cwd:                './apps/web',
      script:             'node_modules/next/dist/bin/next',
      args:               'start',
      interpreter:        'node',
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: webEnv.PORT || 10322,
      },
    },

    // ─────────────────────────────────────────────────────────────
    // Admin Panel  →  admin.ahanesk.com
    // ─────────────────────────────────────────────────────────────
    {
      name:               'ahanesk-admin',
      cwd:                './apps/admin',
      script:             'node_modules/next/dist/bin/next',
      args:               'start',
      interpreter:        'node',
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: adminEnv.PORT || 10323,
      },
    },
  ],
};
