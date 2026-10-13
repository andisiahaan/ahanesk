import { Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import {
  SETTING_KEYS,
  DEFAULT_APP_SETTINGS,
  DEFAULT_AUTH_SETTINGS,
  CACHE_KEY_SETTINGS,
} from '@ahanesk/shared';
import type { SettingKey, SettingValueMap } from '@ahanesk/shared';

@Injectable()
export class SettingsCache {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async get<K extends SettingKey>(key: K): Promise<SettingValueMap[K]> {
    const cacheKey = CACHE_KEY_SETTINGS(key);
    const cached = await this.cache.get<SettingValueMap[K]>(cacheKey);
    if (cached) return cached;

    const record = await this.prisma.setting.findUnique({ where: { key } });
    const value = (record?.settings ?? this.getDefault(key)) as SettingValueMap[K];

    await this.cache.set(cacheKey, value, 60 * 1000);
    return value;
  }

  async invalidate(key: SettingKey): Promise<void> {
    await this.cache.del(CACHE_KEY_SETTINGS(key));
  }

  private getDefault(key: SettingKey): SettingValueMap[SettingKey] {
    switch (key) {
      case SETTING_KEYS.APP:  return DEFAULT_APP_SETTINGS;
      case SETTING_KEYS.AUTH: return DEFAULT_AUTH_SETTINGS;
      default: return {} as SettingValueMap[SettingKey];
    }
  }
}
