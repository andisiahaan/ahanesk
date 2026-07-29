import {
  Controller, Get, Post, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { NotificationService } from './notification.service';
import { NOTIFICATION_TYPE_REGISTRY, type NotificationType } from '@ahanesk/shared';
import { z } from 'zod';

const notificationTypes = Object.keys(NOTIFICATION_TYPE_REGISTRY) as [NotificationType, ...NotificationType[]];

const BroadcastSchema = z.object({
  type:    z.enum(notificationTypes),
  title:   z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  target:  z.enum(['all', 'admins']).default('all'),
  userIds: z.array(z.string().uuid()).optional(),
});

type BroadcastDto = z.infer<typeof BroadcastSchema>;

@Roles('ADMIN')
@Controller('admin/notifications')
export class NotificationAdminController {
  constructor(private readonly svc: NotificationService) {}

  @Get()
  async list(
    @Query('page')  page?:  string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getAllAdmin(Number(page) || 1, Number(limit) || 20);
  }

  @Post('broadcast')
  @HttpCode(HttpStatus.OK)
  async broadcast(
    @Body(new ZodValidationPipe(BroadcastSchema)) dto: BroadcastDto,
  ) {
    if (dto.target === 'admins') {
      await this.svc.sendToAdmins(dto.type, dto.title, dto.message);
    } else if (dto.userIds?.length) {
      await this.svc.sendBroadcast(dto.type, dto.title, dto.message, dto.userIds);
    } else {
      await this.svc.sendToAdmins(dto.type, dto.title, dto.message);
    }
    return { message: 'Broadcast queued' };
  }
}
