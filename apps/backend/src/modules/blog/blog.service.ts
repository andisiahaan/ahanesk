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

  private formatPost<T extends { cover_image?: string | null; author?: { avatar?: string | null } | null }>(post: T): T {
    if (!post) return post;
    return {
      ...post,
      cover_image: this.storage.getUrl(post.cover_image),
      ...(post.author
        ? {
            author: {
              ...post.author,
              avatar: this.storage.getUrl(post.author.avatar),
            },
          }
        : {}),
    };
  }

  // ─── Public ──────────────────────────────────────────────────
  async listPublished(q: ListPostsQueryDto) {
    const res = await this.repo.listPosts(q, false);
    return { ...res, posts: res.posts.map((p) => this.formatPost(p)) };
  }

  async getBySlug(slug: string) {
    const post = await this.repo.findBySlug(slug, true);
    if (!post) throw new NotFoundException('Post not found');
    return this.formatPost(post);
  }

  listActiveCategories() { return this.repo.listCategories(true); }
  listTags(page: number, limit: number) { return this.repo.listTags(page, limit); }

  // ─── Admin ───────────────────────────────────────────────────
  async listAll(q: ListPostsQueryDto) {
    const res = await this.repo.listPosts(q, true);
    return { ...res, posts: res.posts.map((p) => this.formatPost(p)) };
  }

  async getById(id: number | bigint) {
    const post = await this.repo.findById(id);
    if (!post) throw new NotFoundException('Post not found');
    return this.formatPost(post);
  }

  async createPost(dto: CreatePostDto, authorId: number | bigint, file?: UploadedFile) {
    let cover_image: string | undefined;
    if (file) cover_image = await this.storage.upload(file, 'blog_cover');
    const created = await this.repo.create({ ...dto, author_id: authorId, cover_image });
    return this.formatPost(created);
  }

  async updatePost(id: number | bigint, dto: UpdatePostDto, file?: UploadedFile) {
    const post = await this.getById(id);
    let cover_image = post.cover_image ?? undefined;
    if (file) {
      if (cover_image) await this.storage.delete(cover_image).catch(() => {});
      cover_image = await this.storage.upload(file, 'blog_cover');
    }
    const updated = await this.repo.update(id, { ...dto, cover_image });
    return this.formatPost(updated);
  }

  async deletePost(id: number | bigint) {
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

  async updateCategory(id: number | bigint, dto: UpdateCategoryDto, file?: UploadedFile) {
    if (file) {
      const cover_image = await this.storage.upload(file, 'blog_cover');
      return this.repo.updateCategory(id, { ...dto, cover_image });
    }
    return this.repo.updateCategory(id, dto as unknown as Record<string, unknown>);
  }

  deleteCategory(id: number | bigint) { return this.repo.deleteCategory(id); }

  // Tags
  createTag(dto: CreateTagDto) { return this.repo.createTag(dto as unknown as Record<string, unknown>); }
  updateTag(id: number | bigint, dto: UpdateTagDto) { return this.repo.updateTag(id, dto as unknown as Record<string, unknown>); }
  deleteTag(id: number | bigint) { return this.repo.deleteTag(id); }
}
