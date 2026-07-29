import {
  Controller, Get, Patch, Delete, Post, Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser, PushSubscriptionPayload, NotificationPreferences } from '@ahanesk/shared';
import { z } from 'zod';
import { buildPaginationMeta } from '@ahanesk/shared';

const PushSubSchema = z.object({
  endpoint:  z.string().url(),
  p256dh:    z.string().min(1),
  auth:      z.string().min(1),
  userAgent: z.string().optional(),
});

const PreferencesSchema = z.object({
  types:    z.record(z.string(), z.boolean()),
  channels: z.record(z.string(), z.boolean()),
});

const UnsubSchema = z.object({ endpoint: z.string().url() });

@Controller('notifications')
export class NotificationController {
  constructor(private readonly svc: NotificationService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthUser,
    @Query('page')     page?:     string,
    @Query('limit')    limit?:    string,
    @Query('category') category?: string,
    @Query('isRead')   isRead?:   string,
  ) {
    const filter = {
      page:     Number(page)  || 1,
      limit:    Number(limit) || 20,
      category: category || undefined,
      isRead:   isRead !== undefined ? isRead === 'true' : undefined,
    };
    return this.svc.getForUser(user.id, filter);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthUser) {
    return { count: await this.svc.getUnreadCount(user.id) };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markRead(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.svc.markRead(id, user.id);
    return { message: 'Marked as read' };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllRead(@CurrentUser() user: AuthUser) {
    await this.svc.markAllRead(user.id);
    return { message: 'All marked as read' };
  }

  @Get('preferences')
  async getPreferences(@CurrentUser() user: AuthUser) {
    return this.svc.getPreferences(user.id);
  }

  @Patch('preferences')
  @HttpCode(HttpStatus.OK)
  async savePreferences(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(PreferencesSchema)) dto: NotificationPreferences,
  ) {
    await this.svc.savePreferences(user.id, dto);
    return { message: 'Preferences saved' };
  }

  @Post('push/subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribe(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(PushSubSchema)) dto: PushSubscriptionPayload,
  ) {
    await this.svc.subscribePush(user.id, dto);
    return { message: 'Subscribed' };
  }

  @Get('push/subscriptions')
  async listSubscriptions(@CurrentUser() user: AuthUser) {
    return this.svc.getPushSubscriptions(user.id);
  }

  @Delete('push/subscriptions/:id')
  @HttpCode(HttpStatus.OK)
  async deleteSubscription(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.svc.deletePushSubscriptionById(user.id, id);
    return { message: 'Unsubscribed' };
  }

  @Delete('push/unsubscribe')
  @HttpCode(HttpStatus.OK)
  async unsubscribe(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(UnsubSchema)) body: { endpoint: string },
  ) {
    await this.svc.unsubscribePush(user.id, body.endpoint);
    return { message: 'Unsubscribed' };
  }
}
