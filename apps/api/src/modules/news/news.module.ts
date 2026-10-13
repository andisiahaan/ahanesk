import { Module } from '@nestjs/common';
import { NewsController } from './news.controller';
import { NewsAdminController } from './news.admin.controller';
import { NewsService } from './news.service';
import { NewsRepository } from './news.repository';

@Module({
  controllers: [NewsController, NewsAdminController],
  providers:   [NewsService, NewsRepository],
})
export class NewsModule {}
