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

  async findUserForNotification(userId: number | bigint): Promise<{ email: string; name: string } | null> {
    return this.prisma.user.findUnique({ where: { id: BigInt(userId) }, select: { email: true, name: true } });
  }

  async create(data: Prisma.NotificationCreateInput): Promise<void> {
    await this.prisma.notification.create({ data });
  }

  async findForUser(userId: number | bigint, filter: NotificationFilter) {
    const page  = filter.page  ?? 1;
    const limit = filter.limit ?? 20;
    const skip  = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = { user_id: BigInt(userId) };
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

  async getUnreadCount(userId: number | bigint): Promise<number> {
    return this.prisma.notification.count({ where: { user_id: BigInt(userId), is_read: false } });
  }

  async markRead(id: number | bigint, userId: number | bigint): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: BigInt(id), user_id: BigInt(userId), is_read: false },
      data:  { is_read: true, read_at: new Date() },
    });
  }

  async markAllRead(userId: number | bigint): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { user_id: BigInt(userId), is_read: false },
      data:  { is_read: true, read_at: new Date() },
    });
  }

  async upsertPushSubscription(userId: number | bigint, endpoint: string, p256dh: string, auth: string, userAgent?: string): Promise<void> {
    const existing = await this.prisma.pushSubscription.findFirst({ where: { user_id: BigInt(userId), endpoint } });
    if (existing) return;
    await this.prisma.pushSubscription.create({ data: { user_id: BigInt(userId), endpoint, p256dh, auth, user_agent: userAgent } });
  }

  async deletePushSubscription(userId: number | bigint, endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({ where: { user_id: BigInt(userId), endpoint } });
  }

  async deletePushSubscriptionById(userId: number | bigint, id: number | bigint): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({ where: { id: BigInt(id), user_id: BigInt(userId) } });
  }

  async getPushSubscriptions(userId: number | bigint) {
    return this.prisma.pushSubscription.findMany({
      where: { user_id: BigInt(userId) },
      orderBy: { created_at: 'desc' },
      select: { id: true, endpoint: true, user_agent: true, created_at: true },
    });
  }

  async getUserPreferences(userId: number | bigint) {
    const user = await this.prisma.user.findUnique({ where: { id: BigInt(userId) }, select: { preferences: true } });
    const prefs = (user?.preferences as Record<string, unknown> | null) ?? {};
    return (prefs.notifications ?? { types: {}, channels: {} }) as Record<string, unknown>;
  }

  async saveUserPreferences(userId: number | bigint, notificationPrefs: Record<string, unknown>): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: BigInt(userId) }, select: { preferences: true } });
      const prefs: Record<string, unknown> = ((user?.preferences as Record<string, unknown>) ?? {});
      prefs.notifications = notificationPrefs;
      await tx.user.update({ where: { id: BigInt(userId) }, data: { preferences: prefs as Prisma.InputJsonValue } });
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
