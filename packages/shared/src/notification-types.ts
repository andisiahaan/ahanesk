/**
 * Notification System — SSOT Type Definitions
 * @package @ahanesk/shared
 *
 * Konsep category otomatis dari prefix type:
 *   'ticket.replied' → category = 'ticket'
 *   'account.password_changed' → category = 'account'
 */

// ─── Channel Constants ──────────────────────────────────────────────────────

export const NOTIFICATION_CHANNELS = ['database', 'email', 'push'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

/** Channel yang tidak bisa dimatikan user */
export const REQUIRED_CHANNELS: NotificationChannel[] = ['database'];

// ─── Type Registry ───────────────────────────────────────────────────────────

export const NOTIFICATION_TYPE_REGISTRY = {
  // ── Account (security-critical — selalu terkirim) ─────────────────────────
  'account.login_alert':        { securityCritical: true,  adminOnly: false },
  'account.password_changed':   { securityCritical: true,  adminOnly: false },
  'account.email_changed':      { securityCritical: true,  adminOnly: false },
  'account.2fa_enabled':        { securityCritical: true,  adminOnly: false },
  'account.2fa_disabled':       { securityCritical: true,  adminOnly: false },
  'account.2fa_recovery_codes_regenerated': { securityCritical: true,  adminOnly: false },
  'account.banned':             { securityCritical: true,  adminOnly: false },
  'account.unbanned':           { securityCritical: true,  adminOnly: false },

  // ── Blog ─────────────────────────────────────────────────────────────────
  'blog.post_published':        { securityCritical: false, adminOnly: false },

  // ── News ─────────────────────────────────────────────────────────────────
  'news.published':             { securityCritical: false, adminOnly: false },
  'news.maintenance':           { securityCritical: false, adminOnly: false },

  // ── Ticket ───────────────────────────────────────────────────────────────
  'ticket.created':             { securityCritical: false, adminOnly: false },
  'ticket.replied':             { securityCritical: false, adminOnly: false },
  'ticket.status_changed':      { securityCritical: false, adminOnly: false },
  'ticket.closed':              { securityCritical: false, adminOnly: false },

  // ── System ───────────────────────────────────────────────────────────────
  'system.announcement':        { securityCritical: false, adminOnly: false },

  // ── Admin-only (dikirim ke semua ADMIN) ───────────────────────────────────
  'admin.user_registered':      { securityCritical: false, adminOnly: true },
  'admin.ticket_created':       { securityCritical: false, adminOnly: true },
} as const;

export type NotificationType = keyof typeof NOTIFICATION_TYPE_REGISTRY;

export const NOTIFICATION_CATEGORIES = ['account', 'blog', 'news', 'ticket', 'system', 'admin'] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

// ─── Helper Functions ────────────────────────────────────────────────────────

/** Ekstrak category dari type string ('ticket.replied' → 'ticket') */
export function getNotificationCategory(type: NotificationType): NotificationCategory {
  return type.split('.')[0] as NotificationCategory;
}

export function isSecurityCritical(type: NotificationType): boolean {
  return NOTIFICATION_TYPE_REGISTRY[type].securityCritical;
}

export function isAdminOnlyNotification(type: NotificationType): boolean {
  return NOTIFICATION_TYPE_REGISTRY[type].adminOnly;
}

/** Kembalikan semua types untuk category tertentu */
export function getTypesByCategory(category: NotificationCategory): NotificationType[] {
  return (Object.keys(NOTIFICATION_TYPE_REGISTRY) as NotificationType[]).filter(
    (t) => getNotificationCategory(t) === category,
  );
}

/** Semua types yang bukan admin-only (untuk user preference UI) */
export function getUserNotificationTypes(): NotificationType[] {
  return (Object.keys(NOTIFICATION_TYPE_REGISTRY) as NotificationType[]).filter(
    (t) => !isAdminOnlyNotification(t),
  );
}

// ─── DTO Contracts ────────────────────────────────────────────────────────────

/** Payload yang dikirim dari service ke NotificationService.send() */
export interface NotificationPayload {
  type: NotificationType;
  userId: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

/** Shape data notifikasi yang dikembalikan ke frontend */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

/** Preferensi user: { types: { 'ticket.replied': true }, channels: { email: false } } */
export interface NotificationPreferences {
  types:    Partial<Record<NotificationType, boolean>>;
  channels: Partial<Record<NotificationChannel, boolean>>;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  p256dh:   string;
  auth:     string;
  userAgent?: string;
}
