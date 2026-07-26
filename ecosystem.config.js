/**
 * PM2 Ecosystem Config — Ahansk Monorepo
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
const backendEnv = dotenv.config({ path: './apps/backend/.env' }).parsed || {};
const frontendEnv = dotenv.config({ path: './apps/frontend/.env' }).parsed || {};
const adminEnv = dotenv.config({ path: './apps/admin/.env' }).parsed || {};

module.exports = {
  apps: [
    // ─────────────────────────────────────────────────────────────
    // Backend API  →  api.ahansk.com
    // ─────────────────────────────────────────────────────────────
    {
      name:               'ahansk-backend',
      cwd:                './apps/backend',
      script:             'dist/main.js',
      instances:          2,
      exec_mode:          'cluster',
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: backendEnv.PORT || 10311,
      },
    },

    // ─────────────────────────────────────────────────────────────
    // Frontend  →  ahansk.com  (or your domain)
    // ─────────────────────────────────────────────────────────────
    {
      name:               'ahansk-frontend',
      cwd:                './apps/frontend',
      script:             'node_modules/next/dist/bin/next',
      args:               'start',
      interpreter:        'node',
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: frontendEnv.PORT || 10312,
      },
    },

    // ─────────────────────────────────────────────────────────────
    // Admin Panel  →  admin.ahansk.com
    // ─────────────────────────────────────────────────────────────
    {
      name:               'ahansk-admin',
      cwd:                './apps/admin',
      script:             'node_modules/next/dist/bin/next',
      args:               'start',
      interpreter:        'node',
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: adminEnv.PORT || 10313,
      },
    },
  ],
};
