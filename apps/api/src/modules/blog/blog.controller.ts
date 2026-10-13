import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogService } from './blog.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public } from '../../common/decorators/public.decorator';
import { ListPostsQuerySchema } from './blog.dto';
import type { ListPostsQueryDto } from './blog.dto';

/** Public blog routes — no auth required. */
@Controller('blog')
export class BlogController {
  constructor(private readonly svc: BlogService) {}

  @Get('posts')
  @Public()
  list(@Query(new ZodValidationPipe(ListPostsQuerySchema)) q: ListPostsQueryDto) {
    return this.svc.listPublished(q);
  }

  @Get('posts/:slug')
  @Public()
  getBySlug(@Param('slug') slug: string) {
    return this.svc.getBySlug(slug);
  }

  @Get('categories')
  @Public()
  categories() {
    return this.svc.listActiveCategories();
  }

  @Get('tags')
  @Public()
  tags(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.svc.listTags(Number(page) || 1, Number(limit) || 50);
  }
}
