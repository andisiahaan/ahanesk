import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { Setting } from '@prisma/client';

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByKey(key: string): Promise<Setting | null> {
    return this.prisma.setting.findUnique({ where: { key } });
  }

  async upsert(key: string, settings: Record<string, unknown>): Promise<Setting> {
    const json = settings as Parameters<typeof this.prisma.setting.create>[0]['data']['settings'];
    return this.prisma.setting.upsert({
      where: { key },
      create: { key, settings: json },
      update: { settings: json },
    });
  }
}
