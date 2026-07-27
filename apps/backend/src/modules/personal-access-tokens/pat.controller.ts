import { Controller, Get, Post, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PatService } from './pat.service';
import { CreatePatDto } from './pat.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '@ahansk/shared';

@Controller('personal-access-tokens')
export class PatController {
  constructor(private readonly svc: PatService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.svc.listForUser(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePatDto,
  ) {
    return this.svc.create(user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<void> {
    await this.svc.revoke(id, user.id);
  }
}
