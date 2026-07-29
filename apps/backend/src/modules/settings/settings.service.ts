import { Injectable, NotFoundException } from '@nestjs/common';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { SettingsRepository } from './settings.repository';
import { messages, CACHE_KEY_SETTINGS } from '@ahanesk/shared';
import type { UpdateSettingDto } from '@ahanesk/shared';

@Injectable()
export class SettingsService {
  constructor(
    private readonly repo: SettingsRepository,
    private readonly cache: CacheService,
  ) {}

  async getByKey(key: string) {
    const cached = await this.cache.get(CACHE_KEY_SETTINGS(key));
    if (cached) return cached;

    const setting = await this.repo.findByKey(key);
    if (!setting) throw new NotFoundException(messages.settings.notFound);

    await this.cache.set(CACHE_KEY_SETTINGS(key), setting);
    return setting;
  }

  async update(key: string, dto: UpdateSettingDto) {
    const setting = await this.repo.upsert(key, dto.settings as Record<string, unknown>);
    await this.cache.del(CACHE_KEY_SETTINGS(key));
    return setting;
  }
}
