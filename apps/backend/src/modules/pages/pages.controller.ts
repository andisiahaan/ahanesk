import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PagesService } from './pages.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { messages } from '@ahanesk/shared';
import { CreatePageDto, UpdatePageDto } from './pages.dto';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  @Roles('ADMIN')
  async findAll() {
    const data = await this.pagesService.findAll();
    return { success: true, message: messages.pages.listFetched, data };
  }

  @Get('id/:id')
  @Roles('ADMIN')
  async findById(@Param('id') id: string) {
    const data = await this.pagesService.findById(id);
    return { success: true, message: messages.pages.fetched, data };
  }

  @Public()
  @Get(':slug')
  async findPublished(@Param('slug') slug: string, @Query('preview') preview?: string) {
    const isPreview = preview === '1' || preview === 'true';
    const data = isPreview
      ? await this.pagesService.findBySlugForAdmin(slug)
      : await this.pagesService.findPublishedBySlug(slug);
    return { success: true, message: messages.pages.fetched, data };
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() dto: CreatePageDto) {
    const data = await this.pagesService.create(dto);
    return { success: true, message: messages.pages.created, data };
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePageDto,
  ) {
    const data = await this.pagesService.update(id, dto);
    return { success: true, message: messages.pages.updated, data };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.pagesService.delete(id);
  }
}
