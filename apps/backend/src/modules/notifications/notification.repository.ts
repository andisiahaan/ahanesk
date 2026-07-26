import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface NotificationFilter {
  category?: string;
  isRead?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserForNotification(userId: string): Promise<{ email: string; name: string } | null> {
    return this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
  }

  async create(data: Prisma.NotificationCreateInput): Promise<void> {
    await this.prisma.notification.create({ data });
  }

  async findForUser(userId: string, filter: NotificationFilter) {
    const page  = filter.page  ?? 1;
    const limit = filter.limit ?? 20;
    const skip  = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = { user_id: userId };
    if (filter.category !== undefined) where.category = filter.category;
    if (filter.isRead    !== undefined) where.is_read  = filter.isRead;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where, skip, take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { user_id: userId, is_read: false } });
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, user_id: userId, is_read: false },
      data:  { is_read: true, read_at: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data:  { is_read: true, read_at: new Date() },
    });
  }

  async upsertPushSubscription(userId: string, endpoint: string, p256dh: string, auth: string, userAgent?: string): Promise<void> {
    const existing = await this.prisma.pushSubscription.findFirst({ where: { user_id: userId, endpoint } });
    if (existing) return;
    await this.prisma.pushSubscription.create({ data: { user_id: userId, endpoint, p256dh, auth, user_agent: userAgent } });
  }

  async deletePushSubscription(userId: string, endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({ where: { user_id: userId, endpoint } });
  }

  async deletePushSubscriptionById(userId: string, id: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({ where: { id, user_id: userId } });
  }

  async getPushSubscriptions(userId: string) {
    return this.prisma.pushSubscription.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      select: { id: true, endpoint: true, user_agent: true, created_at: true },
    });
  }

  async getUserPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } });
    const prefs = (user?.preferences as Record<string, unknown> | null) ?? {};
    return (prefs.notifications ?? { types: {}, channels: {} }) as Record<string, unknown>;
  }

  async saveUserPreferences(userId: string, notificationPrefs: Record<string, unknown>): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { preferences: true } });
      const prefs: Record<string, unknown> = ((user?.preferences as Record<string, unknown>) ?? {});
      prefs.notifications = notificationPrefs;
      await tx.user.update({ where: { id: userId }, data: { preferences: prefs as Prisma.InputJsonValue } });
    });
  }

  async findAllAdmin(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({ skip, take: limit, orderBy: { created_at: 'desc' }, include: { user: { select: { id: true, name: true, email: true } } } }),
      this.prisma.notification.count(),
    ]);
    return { items, total, page, limit };
  }

  async getAllAdminUsers() {
    return this.prisma.user.findMany({ where: { role: 'ADMIN', is_active: true }, select: { id: true } });
  }
}
