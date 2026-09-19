import { Controller, Get, Post, Patch, Param, Body, Query, UploadedFiles, ParseIntPipe } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StorageUploadInterceptor } from '../../infrastructure/storage/upload.interceptor';
import { CreateTicketDto, CreateReplyDto } from './tickets.dto';
import type { AuthUser } from '@ahanesk/shared';
import type { UploadedFile as StorageFile } from '../../infrastructure/storage/storage.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly svc: TicketsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.listForUser(user.id, Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.svc.getById(id, user.id, false);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTicketDto,
  ) {
    return this.svc.create(dto, user.id);
  }

  @Post(':id/reply')
  @StorageUploadInterceptor('ticket_attachment', true)
  reply(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReplyDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.svc.addReply(id, dto, user.id, false, files as unknown as StorageFile[]);
  }

  @Patch(':id/close')
  close(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.svc.close(id, user.id);
  }
}
