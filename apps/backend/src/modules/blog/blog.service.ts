import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogRepository } from './blog.repository';
import { StorageService } from '../../infrastructure/storage/storage.service';
import type { CreatePostDto, UpdatePostDto, CreateCategoryDto, UpdateCategoryDto, CreateTagDto, UpdateTagDto, ListPostsQueryDto } from './blog.dto';
import type { UploadedFile } from '../../infrastructure/storage/storage.service';

@Injectable()
export class BlogService {
  constructor(
    private readonly repo:    BlogRepository,
    private readonly storage: StorageService,
  ) {}

  // ─── Public ──────────────────────────────────────────────────
  listPublished(q: ListPostsQueryDto) { return this.repo.listPosts(q, false); }

  async getBySlug(slug: string) {
    const post = await this.repo.findBySlug(slug, true);
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  listActiveCategories() { return this.repo.listCategories(true); }
  listTags(page: number, limit: number) { return this.repo.listTags(page, limit); }

  // ─── Admin ───────────────────────────────────────────────────
  listAll(q: ListPostsQueryDto) { return this.repo.listPosts(q, true); }

  async getById(id: string) {
    const post = await this.repo.findById(id);
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async createPost(dto: CreatePostDto, authorId: string, file?: UploadedFile) {
    let cover_image: string | undefined;
    if (file) cover_image = await this.storage.upload(file, 'blog_cover');
    return this.repo.create({ ...dto, author_id: authorId, cover_image });
  }

  async updatePost(id: string, dto: UpdatePostDto, file?: UploadedFile) {
    const post = await this.getById(id);
    let cover_image = post.cover_image ?? undefined;
    if (file) {
      if (cover_image) await this.storage.delete(cover_image).catch(() => {});
      cover_image = await this.storage.upload(file, 'blog_cover');
    }
    return this.repo.update(id, { ...dto, cover_image });
  }

  async deletePost(id: string) {
    const post = await this.getById(id);
    if (post.cover_image) await this.storage.delete(post.cover_image).catch(() => {});
    return this.repo.delete(id);
  }

  // Categories
  listAllCategories() { return this.repo.listCategories(); }

  async createCategory(dto: CreateCategoryDto, file?: UploadedFile) {
    let cover_image: string | undefined;
    if (file) cover_image = await this.storage.upload(file, 'blog_cover');
    return this.repo.createCategory({ ...dto, cover_image });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, file?: UploadedFile) {
    if (file) {
      const cover_image = await this.storage.upload(file, 'blog_cover');
      return this.repo.updateCategory(id, { ...dto, cover_image });
    }
    return this.repo.updateCategory(id, dto as unknown as Record<string, unknown>);
  }

  deleteCategory(id: string) { return this.repo.deleteCategory(id); }

  // Tags
  createTag(dto: CreateTagDto) { return this.repo.createTag(dto as unknown as Record<string, unknown>); }
  updateTag(id: string, dto: UpdateTagDto) { return this.repo.updateTag(id, dto as unknown as Record<string, unknown>); }
  deleteTag(id: string) { return this.repo.deleteTag(id); }
}
