import { Module } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import { PagesRepository } from './pages.repository';

@Module({
  controllers: [PagesController],
  providers: [PagesService, PagesRepository],
})
export class PagesModule {}
