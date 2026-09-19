import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { Prisma } from '@prisma/client';

export interface HelpFilter {
  page?:        number;
  limit?:       number;
  isPublished?: boolean;
  categoryId?:  number | bigint;
  search?:      string;
}

@Injectable()
export class HelpRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Categories ────────────────────────────────────────────────────────────

  async findAllCategories(publishedOnly = false) {
    return this.prisma.helpCategory.findMany({
      where:   publishedOnly ? { is_published: true } : undefined,
      include: { articles: { where: { is_published: true }, select: { id: true } } },
      orderBy: { sort_order: 'asc' },
    });
  }

  async findCategoryBySlug(slug: string) {
    return this.prisma.helpCategory.findUnique({
      where:   { slug },
      include: { articles: { where: { is_published: true }, orderBy: { sort_order: 'asc' } } },
    });
  }

  async createCategory(data: Prisma.HelpCategoryCreateInput) {
    return this.prisma.helpCategory.create({ data });
  }

  async updateCategory(id: number | bigint, data: Prisma.HelpCategoryUpdateInput) {
    return this.prisma.helpCategory.update({ where: { id: BigInt(id) }, data });
  }

  async deleteCategory(id: number | bigint) {
    return this.prisma.helpCategory.delete({ where: { id: BigInt(id) } });
  }

  // ─── Articles ──────────────────────────────────────────────────────────────

  async findAllArticles(filter: HelpFilter) {
    const page  = filter.page  ?? 1;
    const limit = filter.limit ?? 20;
    const skip  = (page - 1) * limit;
    const where: Prisma.HelpArticleWhereInput = {
      ...(filter.isPublished !== undefined && { is_published: filter.isPublished }),
      ...(filter.categoryId && { category_id: BigInt(filter.categoryId) }),
      ...(filter.search && { OR: [
        { title:   { contains: filter.search } },
        { content: { contains: filter.search } },
      ]}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.helpArticle.findMany({ where, skip, take: limit, orderBy: { sort_order: 'asc' }, include: { category: { select: { id: true, title: true, slug: true } } } }),
      this.prisma.helpArticle.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findArticleBySlug(slug: string) {
    return this.prisma.helpArticle.findUnique({ where: { slug }, include: { category: true } });
  }

  async findArticleById(id: number | bigint) {
    return this.prisma.helpArticle.findUnique({ where: { id: BigInt(id) }, include: { category: { select: { id: true, title: true, slug: true } } } });
  }

  async createArticle(data: Prisma.HelpArticleCreateInput) {
    return this.prisma.helpArticle.create({ data, include: { category: { select: { id: true, title: true } } } });
  }

  async updateArticle(id: number | bigint, data: Prisma.HelpArticleUpdateInput) {
    return this.prisma.helpArticle.update({ where: { id: BigInt(id) }, data, include: { category: { select: { id: true, title: true } } } });
  }

  async deleteArticle(id: number | bigint) {
    return this.prisma.helpArticle.delete({ where: { id: BigInt(id) } });
  }

  async voteHelpful(id: number | bigint, helpful: boolean) {
    return this.prisma.helpArticle.update({
      where: { id: BigInt(id) },
      data:  helpful ? { helpful_yes: { increment: 1 } } : { helpful_no: { increment: 1 } },
    });
  }
}
