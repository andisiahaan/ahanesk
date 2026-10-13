import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SettingsRepository } from './settings.repository';
import { CacheService } from '../../infrastructure/cache/cache.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, SettingsRepository, CacheService],
})
export class SettingsModule {}
