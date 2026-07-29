import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { BanRepository } from './ban.repository';
import { NotificationService } from '../notifications/notification.service';
import { UsersRepository } from './users.repository';
import type { BanUserDto } from '@ahanesk/shared';

@Injectable()
export class BanService {
  constructor(
    private readonly banRepo:      BanRepository,
    private readonly usersRepo:    UsersRepository,
    private readonly notifications: NotificationService,
  ) {}

  async banUser(userId: string, adminId: string, dto: BanUserDto): Promise<void> {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN') throw new BadRequestException('Cannot ban an admin');

    const expiresAt = dto.expires_at ? new Date(dto.expires_at) : undefined;
    await this.banRepo.banUser(userId, adminId, dto.reason, expiresAt);

    void this.notifications.send({
      type:    'account.banned',
      userId,
      title:   'Account Suspended',
      message: `Your account has been suspended. Reason: ${dto.reason}`,
    });
  }

  async unbanUser(userId: string, adminId: string): Promise<void> {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const unbanned = await this.banRepo.unbanUser(userId, adminId);
    if (!unbanned) throw new BadRequestException('User is not currently banned');

    void this.notifications.send({
      type:    'account.unbanned',
      userId,
      title:   'Account Restored',
      message: 'Your account suspension has been lifted.',
    });
  }

  async getActiveBan(userId: string) {
    return this.banRepo.getActiveBan(userId);
  }

  async getBanHistory(userId: string) {
    return this.banRepo.getBanHistory(userId);
  }

  async isUserBanned(userId: string): Promise<boolean> {
    const ban = await this.banRepo.getActiveBan(userId);
    return ban !== null;
  }
}
