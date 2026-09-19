import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import * as crypto from 'crypto';

export interface OtpResult {
  code: string; // Dikembalikan sekali saja ke caller — untuk dikirim ke user
  expiresAt: Date;
  cooldownSeconds: number; // 0 = tidak ada cooldown
}

@Injectable()
export class OtpRepository {
  constructor(private readonly prisma: PrismaService) {}

  private hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /** Hapus OTP lama untuk purpose yang sama, lalu buat yang baru */
  async generate(
    userId: number | bigint,
    purpose: string,
    identifier?: string,
    ttlMinutes = 10,
  ): Promise<OtpResult> {
    await this.prisma.otp.deleteMany({ where: { user_id: BigInt(userId), purpose } });

    const code      = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

    await this.prisma.otp.create({
      data: { user_id: BigInt(userId), purpose, identifier: identifier ?? null, code_hash: this.hashCode(code), expires_at: expiresAt },
    });

    return { code, expiresAt, cooldownSeconds: 0 };
  }

  /** Verify OTP — hapus setelah berhasil (delete-on-use) */
  async verify(userId: number | bigint, purpose: string, code: string, identifier?: string): Promise<boolean> {
    const hash = this.hashCode(code.trim());
    const otp  = await this.prisma.otp.findFirst({
      where: { user_id: BigInt(userId), purpose, code_hash: hash, expires_at: { gt: new Date() } },
    });
    if (!otp) return false;
    if (identifier && otp.identifier !== identifier) return false;

    await this.prisma.otp.delete({ where: { id: otp.id } });
    return true;
  }

  /** Kembalikan sisa cooldown (detik). 0 = bisa kirim ulang */
  async cooldownSeconds(userId: number | bigint, purpose: string, cooldown = 60): Promise<number> {
    const latest = await this.prisma.otp.findFirst({
      where: { user_id: BigInt(userId), purpose, created_at: { gt: new Date(Date.now() - cooldown * 1000) } },
      orderBy: { created_at: 'desc' },
    });
    if (!latest) return 0;
    const elapsed = Math.floor((Date.now() - latest.created_at.getTime()) / 1000);
    return Math.max(0, cooldown - elapsed);
  }

  async deleteAllForUser(userId: number | bigint, purpose: string): Promise<void> {
    await this.prisma.otp.deleteMany({ where: { user_id: BigInt(userId), purpose } });
  }
}
