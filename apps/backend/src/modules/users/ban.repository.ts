import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export interface ActiveBan {
  id: bigint;
  reason: string;
  expires_at: Date | null;
  created_at: Date;
  admin: { id: bigint; name: string; email: string };
}

@Injectable()
export class BanRepository {
  constructor(private readonly prisma: PrismaService) {}

  private isActiveBanWhere() {
    return {
      unbanned_at: null,
      OR: [
        { expires_at: null },
        { expires_at: { gt: new Date() } },
      ],
    };
  }

  /** Cek apakah user saat ini sedang di-ban (lazy check) */
  async getActiveBan(userId: number | bigint): Promise<ActiveBan | null> {
    return this.prisma.userBan.findFirst({
      where: { user_id: BigInt(userId), ...this.isActiveBanWhere() },
      select: {
        id: true, reason: true, expires_at: true, created_at: true,
        admin: { select: { id: true, name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /** Ban user baru — otomatis unban aktif yang lama dulu */
  async banUser(userId: number | bigint, adminId: number | bigint, reason: string, expiresAt?: Date): Promise<void> {
    await this.prisma.$transaction([
      // Tutup ban aktif sebelumnya (jika ada)
      this.prisma.userBan.updateMany({
        where:  { user_id: BigInt(userId), ...this.isActiveBanWhere() },
        data:   { unbanned_at: new Date(), unbanned_by: BigInt(adminId) },
      }),
      // Buat ban baru
      this.prisma.userBan.create({
        data: { user_id: BigInt(userId), banned_by: BigInt(adminId), reason, expires_at: expiresAt ?? null },
      }),
    ]);
  }

  /** Unban user (set unbanned_at pada ban aktif) */
  async unbanUser(userId: number | bigint, adminId: number | bigint): Promise<boolean> {
    const result = await this.prisma.userBan.updateMany({
      where: { user_id: BigInt(userId), ...this.isActiveBanWhere() },
      data:  { unbanned_at: new Date(), unbanned_by: BigInt(adminId) },
    });
    return result.count > 0;
  }

  /** Riwayat ban lengkap (semua, termasuk yang sudah dibuka) */
  async getBanHistory(userId: number | bigint) {
    return this.prisma.userBan.findMany({
      where:   { user_id: BigInt(userId) },
      select:  {
        id: true, reason: true, expires_at: true, unbanned_at: true, created_at: true,
        admin:      { select: { id: true, name: true } },
        unban_admin: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
