import { Injectable, NotFoundException } from '@nestjs/common';
import { PagesRepository } from './pages.repository';
import { messages } from '@ahanesk/shared';
import type { CreatePageDto, UpdatePageDto } from '@ahanesk/shared';

@Injectable()
export class PagesService {
  constructor(private readonly repo: PagesRepository) {}

  async findAll() {
    return this.repo.findAll();
  }

  async findPublishedBySlug(slug: string) {
    const page = await this.repo.findBySlug(slug);
    if (!page || !page.is_published) throw new NotFoundException(messages.pages.notFound);
    return page;
  }

  async findBySlugForAdmin(slug: string) {
    const page = await this.repo.findBySlug(slug);
    if (!page) throw new NotFoundException(messages.pages.notFound);
    return page;
  }

  async findById(id: string) {
    const page = await this.repo.findById(id);
    if (!page) throw new NotFoundException(messages.pages.notFound);
    return page;
  }

  async create(dto: CreatePageDto) {
    const publishedAt = dto.is_published ? new Date() : undefined;
    return this.repo.create({ ...dto, published_at: publishedAt });
  }

  async update(id: string, dto: UpdatePageDto) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(messages.pages.notFound);
    const publishedAt = dto.is_published && !existing.published_at ? new Date() : existing.published_at ?? undefined;
    return this.repo.update(id, { ...dto, published_at: publishedAt });
  }

  async delete(id: string): Promise<void> {
    const page = await this.repo.findById(id);
    if (!page) throw new NotFoundException(messages.pages.notFound);
    await this.repo.deleteById(id);
  }
}
