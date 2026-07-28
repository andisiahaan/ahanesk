import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { BanService } from './ban.service';
import { BanRepository } from './ban.repository';
import { UPLOAD_CONFIGS } from '@ahansk/shared';
import { NotificationModule } from '../notifications/notification.module';
import { AuthRepository } from '../auth/auth.repository';

@Module({
  imports: [
    NotificationModule,
    MulterModule.register({
      storage: undefined, // use memory storage — StorageService handles persistence
      limits: { fileSize: UPLOAD_CONFIGS.avatar.maxSizeBytes },
      fileFilter: (_req, file, cb) => {
        const allowed = UPLOAD_CONFIGS.avatar.allowedMimeTypes as readonly string[];
        cb(null, allowed.includes(file.mimetype));
      },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, AuthRepository, BanService, BanRepository],
  exports: [BanService],
})
export class UsersModule {}
