import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UploadedFile, HttpCode, HttpStatus, ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { BanService } from './ban.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StorageUploadInterceptor } from '../../infrastructure/storage/upload.interceptor';
import type { AuthUser } from '@ahanesk/shared';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto, BanUserDto, ChangePasswordDto } from './users.dto';
import type { UploadedFile as StorageFile } from '../../infrastructure/storage/storage.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly banService: BanService,
  ) {}

  // ─── User self-service ────────────────────────────────────────────────────

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @StorageUploadInterceptor('avatar')
  async updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() avatar?: Express.Multer.File & { buffer: Buffer },
  ) {
    const file = avatar ? (avatar as unknown as StorageFile) : undefined;
    return this.usersService.updateProfile(user.id, dto, file);
  }

  @Patch('me/password')
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, dto);
  }

  // ─── Admin endpoints ──────────────────────────────────────────────────────

  @Get()
  @Roles('ADMIN')
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.usersService.findAll(Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  @Roles('ADMIN')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.usersService.delete(id);
  }

  @Post(':id/ban')
  @Roles('ADMIN')
  async banUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BanUserDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.banService.banUser(id, admin.id, dto);
  }

  @Post(':id/unban')
  @Roles('ADMIN')
  async unbanUser(@Param('id', ParseIntPipe) id: number, @CurrentUser() admin: AuthUser) {
    return this.banService.unbanUser(id, admin.id);
  }

  // ─── Session Management (Admin) ───────────────────────────────────────────

  @Get(':id/sessions')
  @Roles('ADMIN')
  async getSessions(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getActiveSessions(id);
  }

  @Delete(':id/sessions')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeAllSessions(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.usersService.revokeAllSessions(id);
  }

  @Delete(':id/sessions/:tokenId')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(
    @Param('id', ParseIntPipe) id: number,
    @Param('tokenId', ParseIntPipe) tokenId: number,
  ): Promise<void> {
    await this.usersService.revokeSession(id, tokenId);
  }

  @Get(':id/activity')
  @Roles('ADMIN')
  async getActivity(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getActivityLog(id);
  }
}
