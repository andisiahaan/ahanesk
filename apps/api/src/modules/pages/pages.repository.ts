import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { Page } from '@prisma/client';

@Injectable()
export class PagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Page[]> {
    return this.prisma.page.findMany({ orderBy: { created_at: 'desc' } });
  }

  async findBySlug(slug: string): Promise<Page | null> {
    return this.prisma.page.findUnique({ where: { slug } });
  }

  async findById(id: number | bigint): Promise<Page | null> {
    return this.prisma.page.findUnique({ where: { id: BigInt(id) } });
  }

  async create(data: { slug: string; title: string; content: string; meta_description?: string; is_published?: boolean; published_at?: Date }): Promise<Page> {
    return this.prisma.page.create({ data });
  }

  async update(id: number | bigint, data: Partial<Page>): Promise<Page> {
    return this.prisma.page.update({ where: { id: BigInt(id) }, data });
  }

  async deleteById(id: number | bigint): Promise<void> {
    await this.prisma.page.delete({ where: { id: BigInt(id) } });
  }
}
