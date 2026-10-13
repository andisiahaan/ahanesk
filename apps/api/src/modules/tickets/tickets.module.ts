import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TicketsController } from './tickets.controller';
import { TicketsAdminController } from './tickets.admin.controller';
import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';
import { UPLOAD_CONFIGS } from '@ahanesk/shared';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    MulterModule.register({
      storage: undefined,
      limits: { fileSize: UPLOAD_CONFIGS.ticket_attachment.maxSizeBytes },
      fileFilter: (_req, file, cb) => {
        cb(null, (UPLOAD_CONFIGS.ticket_attachment.allowedMimeTypes as readonly string[]).includes(file.mimetype));
      },
    }),
    NotificationModule,
  ],
  controllers: [TicketsController, TicketsAdminController],
  providers:   [TicketsService, TicketsRepository],
})
export class TicketsModule {}
