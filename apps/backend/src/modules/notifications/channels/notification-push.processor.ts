import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import * as webpush from 'web-push';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

export interface NotificationPushJob {
  userId:  number | bigint;
  title:   string;
  message: string;
  url?:    string;
}

@Processor('notification-push')
export class NotificationPushProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationPushProcessor.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super();
    const publicKey = this.config.get<string>('app.vapid.publicKey');
    const privateKey = this.config.get<string>('app.vapid.privateKey');
    const contactEmail = this.config.get<string>('app.vapid.contactEmail');

    if (publicKey && privateKey && contactEmail) {
      webpush.setVapidDetails(
        `mailto:${contactEmail}`,
        publicKey,
        privateKey,
      );
    }
  }

  async process(job: Job<NotificationPushJob>): Promise<void> {
    const { userId, title, message, url } = job.data;

    const subscriptions = await this.prisma.pushSubscription.findMany({ where: { user_id: BigInt(userId) } });
    if (!subscriptions.length) return;

    const payload = JSON.stringify({ title, body: message, url: url ?? '/' });

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
            { TTL: 86400 },
          );
        } catch (err: unknown) {
          const status = (err as { statusCode?: number }).statusCode;
          // 410 Gone = subscription expired → remove it
          if (status === 410 || status === 404) {
            await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
          } else {
            this.logger.warn(`[notification:push] Failed sub ${sub.id}`, err);
          }
        }
      }),
    );
  }
}
