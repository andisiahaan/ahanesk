import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { buildPaginationMeta } from '@ahanesk/shared';
import type { ListNewsQueryDto } from './news.dto';

@Injectable()
export class NewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: ListNewsQueryDto, adminMode = false) {
    const skip = (q.page - 1) * q.limit;
    const now  = new Date();
    const where: Record<string, unknown> = {};

    if (!adminMode) {
      where['is_published'] = true;
      where['OR'] = [{ expires_at: null }, { expires_at: { gt: now } }];
    }
    if (q.type)   where['type']      = q.type;
    if (q.pinned) where['is_pinned'] = true;

    const [items, total] = await Promise.all([
      this.prisma.newsItem.findMany({
        where, skip, take: q.limit,
        orderBy: [{ is_pinned: 'desc' }, { published_at: 'desc' }, { created_at: 'desc' }],
        include: { author: { select: { id: true, name: true } } },
      }),
      this.prisma.newsItem.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(total, q.page, q.limit) };
  }

  findBySlug(slug: string, published = true) {
    const now = new Date();
    return this.prisma.newsItem.findFirst({
      where: {
        slug,
        ...(published ? {
          is_published: true,
          OR: [{ expires_at: null }, { expires_at: { gt: now } }],
        } : {}),
      },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  findById(id: string) {
    return this.prisma.newsItem.findUnique({ where: { id }, include: { author: { select: { id: true, name: true } } } });
  }

  create(data: Record<string, unknown>) { return this.prisma.newsItem.create({ data: data as never }); }
  update(id: string, data: Record<string, unknown>) { return this.prisma.newsItem.update({ where: { id }, data: data as never }); }
  delete(id: string) { return this.prisma.newsItem.delete({ where: { id } }); }
}
