import { Injectable, NotFoundException } from '@nestjs/common';
import { NewsRepository } from './news.repository';
import type { CreateNewsDto, UpdateNewsDto, ListNewsQueryDto } from './news.dto';

@Injectable()
export class NewsService {
  constructor(private readonly repo: NewsRepository) {}

  listPublished(q: ListNewsQueryDto)   { return this.repo.list(q, false); }
  listAll(q: ListNewsQueryDto)         { return this.repo.list(q, true); }

  async getBySlug(slug: string, admin = false) {
    const item = await this.repo.findBySlug(slug, !admin);
    if (!item) throw new NotFoundException('News item not found');
    return item;
  }

  async getById(id: number | bigint) {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException('News item not found');
    return item;
  }

  create(dto: CreateNewsDto, authorId: number | bigint) {
    return this.repo.create({ ...dto, author_id: BigInt(authorId) });
  }

  update(id: number | bigint, dto: UpdateNewsDto) {
    return this.repo.update(id, dto as Record<string, unknown>);
  }

  async delete(id: number | bigint) {
    await this.getById(id);
    return this.repo.delete(id);
  }
}
