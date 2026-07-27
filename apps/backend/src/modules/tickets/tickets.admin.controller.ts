import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseInterceptors, UploadedFiles, HttpCode, HttpStatus } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { TicketsService } from './tickets.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

import {
  UpdateTicketAdminDto, CreateReplyDto, ListTicketsQueryDto,
} from './tickets.dto';
import type { AuthUser } from '@ahansk/shared';
import type { UploadedFile as StorageFile } from '../../infrastructure/storage/storage.service';

@Controller('admin/tickets')
@Roles('ADMIN')
export class TicketsAdminController {
  constructor(private readonly svc: TicketsService) {}

  @Get()
  listTickets(@Query() q: ListTicketsQueryDto) {
    return this.svc.listAll(q);
  }

  @Get(':id')
  get(@Param('id') id: string) { return this.svc.getById(id, undefined, true); }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketAdminDto,
  ) {
    return this.svc.adminUpdate(id, dto);
  }

  @Post(':id/reply')
  @UseInterceptors(FilesInterceptor('attachments', 10))
  reply(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateReplyDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.svc.addReply(id, dto, user.id, true, files as unknown as StorageFile[]);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> { await this.svc.delete(id); }
}
