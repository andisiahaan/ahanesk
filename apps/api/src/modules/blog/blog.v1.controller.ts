import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogService } from './blog.service';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ListPostsQuerySchema } from './blog.dto';
import type { ListPostsQueryDto } from './blog.dto';

/** External API routes — same data as BlogController, versioned under /v1/blog */
@Controller('v1/blog')
export class BlogV1Controller {
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
}
