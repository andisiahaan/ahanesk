import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { ListPostsQueryDto } from './blog.dto';

const POST_SUMMARY = {
  id: true, title: true, slug: true, excerpt: true, cover_image: true,
  status: true, published_at: true, is_featured: true, view_count: true, created_at: true,
  author: { select: { id: true, name: true, avatar: true } },
  categories: { select: { id: true, name: true, slug: true } },
  tags:       { select: { id: true, name: true, slug: true } },
};

@Injectable()
export class BlogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPosts(q: ListPostsQueryDto, adminMode = false) {
    const skip  = (q.page - 1) * q.limit;
    const where: Record<string, unknown> = {};
    if (!adminMode) where['status'] = 'PUBLISHED';
    else if (q.status) where['status'] = q.status;
    if (q.featured)  where['is_featured'] = true;
    if (q.search)    where['OR'] = [{ title: { contains: q.search } }, { excerpt: { contains: q.search } }];
    if (q.category)  where['categories'] = { some: { slug: q.category } };
    if (q.tag)       where['tags']       = { some: { slug: q.tag } };

    const orderBy = q.sort === 'popular' ? { view_count: 'desc' as const } : { published_at: 'desc' as const };

    const [posts, total] = await Promise.all([
      this.prisma.blogPost.findMany({ where, skip, take: q.limit, orderBy, select: POST_SUMMARY }),
      this.prisma.blogPost.count({ where }),
    ]);
    return { posts, pagination: { page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) } };
  }

  findBySlug(slug: string, published = true) {
    return this.prisma.blogPost.findFirst({
      where: { slug, ...(published ? { status: 'PUBLISHED' } : {}) },
      include: { author: { select: { id: true, name: true, avatar: true } }, categories: true, tags: true },
    });
  }

  findById(id: string) {
    return this.prisma.blogPost.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true, avatar: true } }, categories: true, tags: true },
    });
  }

  async create(data: Record<string, unknown>) {
    const { categories, tags, ...rest } = data as { categories: string[]; tags: string[]; [key: string]: unknown };
    
    const tagIds = await this.ensureTagsExist(tags || []);

    return this.prisma.blogPost.create({
      data: Object.assign({}, rest, {
        categories: { connect: (categories || []).map((id) => ({ id })) },
        tags:       { connect: tagIds.map((id) => ({ id })) },
      }) as never,
      include: { categories: true, tags: true },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    const { categories, tags, ...rest } = data as { categories?: string[]; tags?: string[]; [key: string]: unknown };
    
    const tagIds = tags ? await this.ensureTagsExist(tags) : undefined;

    return this.prisma.blogPost.update({
      where: { id },
      data: Object.assign({}, rest, {
        ...(categories ? { categories: { set: categories.map((cid) => ({ id: cid })) } } : {}),
        ...(tags       ? { tags:       { set: tagIds!.map((tid) => ({ id: tid })) } }       : {}),
      }) as never,
      include: { categories: true, tags: true },
    });
  }

  private async ensureTagsExist(tags: string[]): Promise<string[]> {
    if (!tags || tags.length === 0) return [];
    
    const processed = tags.map(t => {
      const slug = t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      return { name: t, slug };
    });
    
    const slugs = processed.map(p => p.slug);
    
    const existingTags = await this.prisma.blogTag.findMany({
      where: { slug: { in: slugs } },
      select: { id: true, slug: true }
    });
    
    const existingSlugs = new Set(existingTags.map(t => t.slug));
    const newTags = processed.filter(p => !existingSlugs.has(p.slug));
    
    if (newTags.length > 0) {
      await this.prisma.blogTag.createMany({
        data: newTags,
        skipDuplicates: true,
      });
      
      const allTags = await this.prisma.blogTag.findMany({
        where: { slug: { in: slugs } },
        select: { id: true }
      });
      return allTags.map(t => t.id);
    }
    
    return existingTags.map(t => t.id);
  }

  delete(id: string) { return this.prisma.blogPost.delete({ where: { id } }); }

  // Categories
  listCategories(active?: boolean) {
    return this.prisma.blogCategory.findMany({
      where: active !== undefined ? { is_active: active } : {},
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { posts: true } } },
    });
  }
  createCategory(data: Record<string, unknown>) { return this.prisma.blogCategory.create({ data: data as never }); }
  updateCategory(id: string, data: Record<string, unknown>) { return this.prisma.blogCategory.update({ where: { id }, data: data as never }); }
  deleteCategory(id: string) { return this.prisma.blogCategory.delete({ where: { id } }); }

  // Tags
  listTags(page: number, limit: number) {
    return this.prisma.blogTag.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' }, include: { _count: { select: { posts: true } } } });
  }
  createTag(data: Record<string, unknown>) { return this.prisma.blogTag.create({ data: data as never }); }
  updateTag(id: string, data: Record<string, unknown>) { return this.prisma.blogTag.update({ where: { id }, data: data as never }); }
  deleteTag(id: string) { return this.prisma.blogTag.delete({ where: { id } }); }
}
