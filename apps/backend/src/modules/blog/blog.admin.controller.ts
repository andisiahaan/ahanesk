import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UploadedFile, HttpCode, HttpStatus, ParseIntPipe,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StorageUploadInterceptor } from '../../infrastructure/storage/upload.interceptor';
import {
  CreatePostDto, UpdatePostDto, CreateCategoryDto, UpdateCategoryDto,
  CreateTagDto, UpdateTagDto, ListPostsQueryDto,
} from './blog.dto';
import type { AuthUser } from '@ahanesk/shared';
import type { UploadedFile as StorageFile } from '../../infrastructure/storage/storage.service';

@Controller('admin/blog')
@Roles('ADMIN')
export class BlogAdminController {
  constructor(private readonly svc: BlogService) {}

  // ─── Posts ───────────────────────────────────────────────────
  @Get('posts')
  listPosts(@Query() q: ListPostsQueryDto) {
    return this.svc.listAll(q);
  }

  @Get('posts/:id')
  getPost(@Param('id', ParseIntPipe) id: number) { return this.svc.getById(id); }

  @Post('posts')
  @StorageUploadInterceptor('blog_cover')
  createPost(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.svc.createPost(dto, user.id, file as unknown as StorageFile);
  }

  @Patch('posts/:id')
  @StorageUploadInterceptor('blog_cover')
  updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.svc.updatePost(id, dto, file as unknown as StorageFile);
  }

  @Delete('posts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.svc.deletePost(id);
  }

  // ─── Categories ──────────────────────────────────────────────
  @Get('categories')
  listCategories() { return this.svc.listAllCategories(); }

  @Post('categories')
  @StorageUploadInterceptor('blog_cover')
  createCategory(@Body() dto: CreateCategoryDto, @UploadedFile() file?: Express.Multer.File) {
    return this.svc.createCategory(dto, file as unknown as StorageFile);
  }

  @Patch('categories/:id')
  @StorageUploadInterceptor('blog_cover')
  updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto, @UploadedFile() file?: Express.Multer.File) {
    return this.svc.updateCategory(id, dto, file as unknown as StorageFile);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCategory(@Param('id', ParseIntPipe) id: number): Promise<void> { await this.svc.deleteCategory(id); }

  // ─── Tags ────────────────────────────────────────────────────
  @Get('tags')
  listTags(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.svc.listTags(Number(page) || 1, Number(limit) || 50);
  }

  @Post('tags')
  createTag(@Body() dto: CreateTagDto) { return this.svc.createTag(dto); }

  @Patch('tags/:id')
  updateTag(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTagDto) {
    return this.svc.updateTag(id, dto);
  }

  @Delete('tags/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTag(@Param('id', ParseIntPipe) id: number): Promise<void> { await this.svc.deleteTag(id); }
}
