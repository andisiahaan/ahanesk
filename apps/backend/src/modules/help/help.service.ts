import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { HelpRepository } from './help.repository';
import { buildPaginationMeta } from '@ahanesk/shared';
import type {
  CreateHelpCategoryDto, UpdateHelpCategoryDto,
  CreateHelpArticleDto, UpdateHelpArticleDto,
} from '@ahanesk/shared';

@Injectable()
export class HelpService {
  constructor(private readonly repo: HelpRepository) {}

  // ─── Public ────────────────────────────────────────────────────────────────

  async getPublicCategories() {
    return this.repo.findAllCategories(true);
  }

  async getPublicArticleBySlug(slug: string) {
    const article = await this.repo.findArticleBySlug(slug);
    if (!article || !article.is_published) throw new NotFoundException('Article not found');
    return article;
  }

  async searchArticles(query: string) {
    const result = await this.repo.findAllArticles({ isPublished: true, search: query, limit: 10 });
    return result.items;
  }

  async voteHelpful(id: string, helpful: boolean) {
    const article = await this.repo.findArticleById(id);
    if (!article) throw new NotFoundException('Article not found');
    return this.repo.voteHelpful(id, helpful);
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  async adminListCategories() {
    return this.repo.findAllCategories(false);
  }

  async adminListArticles(page = 1, limit = 20, categoryId?: string) {
    const result = await this.repo.findAllArticles({ page, limit, categoryId });
    return { items: result.items, meta: buildPaginationMeta(result.total, page, limit) };
  }

  async adminGetArticle(id: string) {
    const article = await this.repo.findArticleById(id);
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  async createCategory(dto: CreateHelpCategoryDto) {
    return this.repo.createCategory({
      slug: dto.slug, title: dto.title,
      description: dto.description ?? null, icon: dto.icon ?? null,
      sort_order: dto.sort_order ?? 0, is_published: dto.is_published ?? true,
    });
  }

  async updateCategory(id: string, dto: UpdateHelpCategoryDto) {
    return this.repo.updateCategory(id, dto);
  }

  async deleteCategory(id: string) {
    await this.repo.deleteCategory(id);
  }

  async createArticle(dto: CreateHelpArticleDto) {
    const publishedAt = dto.is_published ? new Date() : null;
    return this.repo.createArticle({
      category:        { connect: { id: dto.category_id } },
      slug:            dto.slug, title: dto.title, content: dto.content,
      meta_description: dto.meta_description ?? null,
      sort_order:      dto.sort_order ?? 0,
      is_published:    dto.is_published ?? false,
      published_at:    publishedAt,
    });
  }

  async updateArticle(id: string, dto: UpdateHelpArticleDto) {
    const article = await this.repo.findArticleById(id);
    if (!article) throw new NotFoundException('Article not found');

    const publishedAt = dto.is_published && !article.published_at ? new Date() : article.published_at;
    return this.repo.updateArticle(id, { ...dto, published_at: publishedAt });
  }

  async deleteArticle(id: string) {
    await this.repo.deleteArticle(id);
  }
}
