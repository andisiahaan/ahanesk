import { Injectable, BadRequestException } from '@nestjs/common';
import { OtpRepository } from './otp.repository';
import { EmailService } from '../../infrastructure/email/email.service';
import type { OTP_PURPOSE } from '@ahanesk/shared';

@Injectable()
export class OtpService {
  constructor(
    private readonly repo: OtpRepository,
    private readonly email: EmailService,
  ) {}

  /**
   * Generate OTP dan kirim ke email user.
   * @returns cooldownSeconds — 0 jika berhasil dikirim, >0 jika masih cooldown
   */
  async sendOtp(opts: {
    userId: string;
    purpose: OTP_PURPOSE;
    toEmail: string;
    toName: string;
    identifier?: string;
    ttlMinutes?: number;
    cooldownSeconds?: number;
  }): Promise<{ sent: boolean; cooldownSeconds: number }> {
    const remaining = await this.repo.cooldownSeconds(opts.userId, opts.purpose, opts.cooldownSeconds ?? 60);
    if (remaining > 0) return { sent: false, cooldownSeconds: remaining };

    const { code, expiresAt } = await this.repo.generate(
      opts.userId, opts.purpose, opts.identifier, opts.ttlMinutes ?? 10,
    );

    await this.email.sendOtpEmail(opts.toEmail, opts.toName, code, opts.purpose, expiresAt);
    return { sent: true, cooldownSeconds: 0 };
  }

  /**
   * Verify OTP yang dikirim user.
   * @returns true jika valid (auto delete-on-use)
   */
  async verifyOtp(opts: {
    userId: string;
    purpose: OTP_PURPOSE;
    code: string;
    identifier?: string;
  }): Promise<boolean> {
    return this.repo.verify(opts.userId, opts.purpose, opts.code, opts.identifier);
  }

  async getCooldown(userId: string, purpose: OTP_PURPOSE, cooldownSec = 60): Promise<number> {
    return this.repo.cooldownSeconds(userId, purpose, cooldownSec);
  }
}
