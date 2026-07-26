import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import {
  type NotificationType,
  type NotificationPreferences,
  type PushSubscriptionPayload,
  getNotificationCategory,
  isSecurityCritical,
  NOTIFICATION_CHANNELS,
  REQUIRED_CHANNELS,
} from '@ahansk/shared';
import { NotificationRepository } from './notification.repository';
import { buildPaginationMeta } from '@ahansk/shared';

interface SendInput {
  type:    NotificationType;
  userId:  string;
  title:   string;
  message: string;
  data?:   Record<string, unknown>;
}

interface ChannelJob {
  userId: string;
  title:  string;
  message: string;
  data?:  Record<string, unknown>;
  url?:   string;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly repo: NotificationRepository,
    private readonly config: ConfigService,
    @InjectQueue('notification-email') private readonly emailQueue: Queue,
    @InjectQueue('notification-push')  private readonly pushQueue:  Queue,
  ) {}

  // ─── Core Send ─────────────────────────────────────────────────────────────

  async send(input: SendInput): Promise<void> {
    const category = getNotificationCategory(input.type);

    // 1. Selalu simpan ke database
    await this.repo.create({
      user:     { connect: { id: input.userId } },
      type:     input.type,
      category,
      title:    input.title,
      message:  input.message,
      data:     input.data !== undefined ? (input.data as Prisma.InputJsonValue) : Prisma.DbNull,
    });

    // 2. Resolve channels aktif untuk user ini
    const channels = await this.resolveChannels(input.userId, input.type);
    const pushJob: ChannelJob = {
      userId:  input.userId,
      title:   input.title,
      message: input.message,
      data:    input.data,
      url:     input.data?.url as string | undefined,
    };

    if (channels.includes('email')) {
      const user = await this.repo.findUserForNotification(input.userId);
      if (user) {
        await this.emailQueue.add('send', {
          ...pushJob,
          type: input.type,
          to:   user.email,
          name: user.name,
        }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
      }
    }
    if (channels.includes('push')) {
      await this.pushQueue.add('send', pushJob, { attempts: 3, backoff: { type: 'exponential', delay: 3000 } });
    }
  }

  async sendToAdmins(type: NotificationType, title: string, message: string, data?: Record<string, unknown>): Promise<void> {
    const admins = await this.repo.getAllAdminUsers();
    await Promise.all(admins.map((a) => this.send({ type, userId: a.id, title, message, data })));
  }

  async sendBroadcast(type: NotificationType, title: string, message: string, userIds: string[], data?: Record<string, unknown>): Promise<void> {
    await Promise.all(userIds.map((userId) => this.send({ type, userId, title, message, data })));
  }

  // ─── Query Methods ─────────────────────────────────────────────────────────

  async getForUser(userId: string, filter: { page?: number; limit?: number; category?: string; isRead?: boolean }) {
    const result = await this.repo.findForUser(userId, filter);
    return { items: result.items, meta: buildPaginationMeta(result.total, result.page, result.limit) };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.repo.getUnreadCount(userId);
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.repo.markRead(id, userId);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.markAllRead(userId);
  }

  async getAllAdmin(page: number, limit: number) {
    const result = await this.repo.findAllAdmin(page, limit);
    return { items: result.items, meta: buildPaginationMeta(result.total, result.page, result.limit) };
  }

  // ─── Preferences ────────────────────────────────────────────────────────────

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const raw = await this.repo.getUserPreferences(userId);
    return {
      types:    (raw.types    as NotificationPreferences['types'])    ?? {},
      channels: (raw.channels as NotificationPreferences['channels']) ?? {},
    };
  }

  async savePreferences(userId: string, prefs: NotificationPreferences): Promise<void> {
    await this.repo.saveUserPreferences(userId, { types: prefs.types, channels: prefs.channels });
  }

  // ─── Push Subscription ────────────────────────────────────────────────────

  async subscribePush(userId: string, sub: PushSubscriptionPayload): Promise<void> {
    await this.repo.upsertPushSubscription(userId, sub.endpoint, sub.p256dh, sub.auth, sub.userAgent);
  }

  async unsubscribePush(userId: string, endpoint: string): Promise<void> {
    await this.repo.deletePushSubscription(userId, endpoint);
  }

  async getPushSubscriptions(userId: string) {
    return this.repo.getPushSubscriptions(userId);
  }

  async deletePushSubscriptionById(userId: string, id: string): Promise<void> {
    await this.repo.deletePushSubscriptionById(userId, id);
  }

  // ─── Private: Channel Resolution ──────────────────────────────────────────

  private async resolveChannels(userId: string, type: NotificationType): Promise<string[]> {
    const active: string[] = [];
    const prefs  = await this.getPreferences(userId);

    for (const ch of NOTIFICATION_CHANNELS) {
      if (REQUIRED_CHANNELS.includes(ch)) continue; // database sudah ditangani di atas
      if (!isSecurityCritical(type)) {
        // Cek user preference channel
        if (prefs.channels[ch] === false) continue;
      }
      // Cek push hanya jika ada subscription
      if (ch === 'push') {
        const subs = await this.repo.getPushSubscriptions(userId);
        if (!subs.length) continue;
      }
      active.push(ch);
    }
    return active;
  }
}
