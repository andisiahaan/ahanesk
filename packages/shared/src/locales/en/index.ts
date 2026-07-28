import modulesAuth from './modules/auth.json';
import modulesCommon from './modules/common.json';
import modulesBlog from './modules/blog.json';
import modulesNotifications from './modules/notifications.json';

import frontendNav from './frontend/nav.json';
import frontendBlog from './frontend/blog.json';
import frontendDashboard from './frontend/dashboard.json';
import frontendAccount from './frontend/account.json';

import adminNav from './admin/nav.json';
import adminDashboard from './admin/dashboard.json';
import adminBlog from './admin/blog.json';
import adminUsers from './admin/users.json';
import adminNews from './admin/news.json';
import adminSettings from './admin/settings.json';
import adminNotifications from './admin/notifications.json';
import adminHelp from './admin/help.json';
import adminApiKeys from './admin/api-keys.json';

/**
 * English locale data — structured by layer:
 *  - modules/  : cross-app strings, identical in all apps
 *  - frontend/ : strings specific to the user-facing frontend app
 *  - admin/    : strings specific to the admin dashboard app
 *
 * To add a new module, add the JSON file under modules/ and re-export here.
 * To add a new app, create its subfolder and re-export here.
 */
export const en = {
  modules: {
    auth:          modulesAuth,
    common:        modulesCommon,
    blog:          modulesBlog,
    notifications: modulesNotifications,
  },
  frontend: {
    nav:       frontendNav,
    blog:      frontendBlog,
    dashboard: frontendDashboard,
    account:   frontendAccount,
  },
  admin: {
    nav:           adminNav,
    dashboard:     adminDashboard,
    blog:          adminBlog,
    users:         adminUsers,
    news:          adminNews,
    settings:      adminSettings,
    notifications: adminNotifications,
    help:          adminHelp,
    'api-keys':    adminApiKeys,
  },
} as const;
