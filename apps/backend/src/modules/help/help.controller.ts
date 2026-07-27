import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { HelpService } from './help.service';
import { Public } from '../../common/decorators/public.decorator';
import { VoteHelpfulDto } from './help.dto';

@Controller('help')
export class HelpController {
  constructor(private readonly service: HelpService) {}

  @Public()
  @Get('categories')
  async getCategories() {
    return this.service.getPublicCategories();
  }

  @Public()
  @Get('articles/search')
  async search(@Query('q') q: string) {
    return this.service.searchArticles(q ?? '');
  }

  @Public()
  @Get('articles/:slug')
  async getArticle(@Param('slug') slug: string) {
    return this.service.getPublicArticleBySlug(slug);
  }

  @Post('articles/:id/vote')
  async vote(
    @Param('id') id: string,
    @Body() dto: VoteHelpfulDto,
  ) {
    return this.service.voteHelpful(id, dto.helpful);
  }
}
