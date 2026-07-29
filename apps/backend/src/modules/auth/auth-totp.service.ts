import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import type { Response } from 'express';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { NotificationService } from '../notifications/notification.service';
import { messages, TOTP_RECOVERY_CODE_COUNT } from '@ahanesk/shared';
import type { EnableTotpDto, DisableTotpDto, VerifyTotpDto } from '@ahanesk/shared';

@Injectable()
export class AuthTotpService {
  constructor(
    private readonly repo:          AuthRepository,
    private readonly jwt:           JwtService,
    private readonly config:        ConfigService,
    private readonly authService:   AuthService,
    private readonly notifications: NotificationService,
  ) {}

  async setupTotp(userId: string): Promise<{ secret: string; qrCodeDataUrl: string }> {
    const user = await this.repo.findUserById(userId);
    if (!user) throw new UnauthorizedException();
    if (user.totp_enabled) throw new BadRequestException(messages.auth.twoFactorAlreadyEnabled);

    const secret = authenticator.generateSecret(20);
    const otpauthUrl = authenticator.keyuri(user.email, 'AhanESK', secret);
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    await this.repo.updateUser(userId, { totp_secret: secret });
    return { secret, qrCodeDataUrl };
  }

  async enableTotp(userId: string, dto: EnableTotpDto): Promise<{ recoveryCodes: string[] }> {
    const user = await this.repo.findUserById(userId);
    if (!user?.totp_secret) throw new BadRequestException('TOTP setup not initiated');
    if (user.totp_enabled) throw new BadRequestException(messages.auth.twoFactorAlreadyEnabled);

    const isValid = authenticator.verify({ token: dto.code, secret: user.totp_secret });
    if (!isValid) throw new BadRequestException(messages.auth.twoFactorInvalid);

    const codes = Array.from({ length: TOTP_RECOVERY_CODE_COUNT }, () =>
      crypto.randomBytes(5).toString('hex').toUpperCase().match(/.{1,5}/g)!.join('-'),
    );
    const codeHashes = await Promise.all(codes.map((c) => argon2.hash(c)));

    await this.repo.deleteAllRecoveryCodes(userId);
    await this.repo.createTotpRecoveryCodes(userId, codeHashes);
    await this.repo.updateUser(userId, { totp_enabled: true, totp_verified_at: new Date() });

    void this.notifications.send({
      type:    'account.2fa_enabled',
      userId,
      title:   'Two-Factor Authentication Enabled',
      message: 'Two-factor authentication has been enabled on your account.',
    });
    return { recoveryCodes: codes };
  }

  async regenerateRecoveryCodes(userId: string, dto: DisableTotpDto): Promise<{ recoveryCodes: string[] }> {
    const user = await this.repo.findUserById(userId);
    if (!user) throw new UnauthorizedException();
    if (!user.totp_enabled) throw new BadRequestException(messages.auth.twoFactorNotEnabled);
    if (!user.password) throw new BadRequestException('Password not set');

    const valid = await argon2.verify(user.password, dto.password);
    if (!valid) throw new BadRequestException(messages.auth.invalidPassword);

    const codes = Array.from({ length: TOTP_RECOVERY_CODE_COUNT }, () =>
      crypto.randomBytes(5).toString('hex').toUpperCase().match(/.{1,5}/g)!.join('-'),
    );
    const codeHashes = await Promise.all(codes.map((c) => argon2.hash(c)));

    await this.repo.deleteAllRecoveryCodes(userId);
    await this.repo.createTotpRecoveryCodes(userId, codeHashes);

    void this.notifications.send({
      type:    'account.2fa_recovery_codes_regenerated',
      userId,
      title:   '2FA Recovery Codes Regenerated',
      message: 'Your two-factor authentication recovery codes have been regenerated. The old codes are no longer valid.',
    });
    return { recoveryCodes: codes };
  }

  async disableTotp(userId: string, dto: DisableTotpDto): Promise<{ message: string }> {
    const user = await this.repo.findUserById(userId);
    if (!user) throw new UnauthorizedException();
    if (!user.totp_enabled) throw new BadRequestException(messages.auth.twoFactorNotEnabled);
    if (!user.password) throw new BadRequestException('Password not set');

    const valid = await argon2.verify(user.password, dto.password);
    if (!valid) throw new BadRequestException(messages.auth.invalidPassword);

    await this.repo.updateUser(userId, { totp_enabled: false, totp_secret: null, totp_verified_at: null });
    await this.repo.deleteAllRecoveryCodes(userId);
    void this.notifications.send({
      type:    'account.2fa_disabled',
      userId,
      title:   'Two-Factor Authentication Disabled',
      message: 'Two-factor authentication has been disabled on your account. If you did not do this, secure your account immediately.',
    });
    return { message: '2FA disabled successfully' };
  }

  async verifyTotpLogin(dto: VerifyTotpDto, res: Response, ip?: string, ua?: string) {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwt.verify<{ sub: string; type: string }>(dto.partialToken, {
        secret: this.config.get('app.jwt.accessSecret'),
      });
    } catch {
      throw new UnauthorizedException(messages.auth.invalidToken);
    }
    if (payload.type !== 'partial') throw new UnauthorizedException(messages.auth.invalidToken);

    const user = await this.repo.findUserById(payload.sub);
    if (!user?.totp_secret) throw new UnauthorizedException();

    if (dto.code.length === 6 && /^\d+$/.test(dto.code)) {
      const valid = authenticator.verify({ token: dto.code, secret: user.totp_secret });
      if (!valid) throw new UnauthorizedException(messages.auth.twoFactorInvalid);
    } else {
      const recoveryCodes = await this.repo.findUnusedRecoveryCodes(user.id);
      let matched: (typeof recoveryCodes)[0] | undefined;
      for (const rc of recoveryCodes) {
        if (await argon2.verify(rc.code_hash, dto.code)) { matched = rc; break; }
      }
      if (!matched) throw new UnauthorizedException(messages.auth.invalidRecoveryCode);
      await this.repo.consumeRecoveryCode(matched.id);
    }

    await this.repo.createUserActivity({ user_id: user.id, type: 'LOGIN', email: user.email, success: true, ip_address: ip, user_agent: ua });
    return this.authService.issueTokens(user.id, res, ip, ua);
  }
}
