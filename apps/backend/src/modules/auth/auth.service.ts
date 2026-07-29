import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { AuthRepository } from './auth.repository';
import { EmailService } from '../../infrastructure/email/email.service';
import { RecaptchaService } from '../../infrastructure/recaptcha/recaptcha.service';
import { SettingsCache } from '../../infrastructure/settings/settings-cache.service';
import { NotificationService } from '../notifications/notification.service';
import { OtpService } from '../otp/otp.service';
import { BanService } from '../users/ban.service';
import { messages, SETTING_KEYS } from '@ahanesk/shared';
import type {
  RegisterDto, LoginDto, GoogleAuthDto,
  ForgotPasswordDto, ResetPasswordDto, AuthUser,
  RequestEmailChangeDto, VerifyEmailChangeOtpDto
} from '@ahanesk/shared';

const COOKIE_DEFAULTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

@Injectable()
export class AuthService {
  private readonly googleClientId: string;
  private readonly googleClient: OAuth2Client | null;

  constructor(
    private readonly repo: AuthRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
    private readonly recaptcha: RecaptchaService,
    private readonly settingsCache: SettingsCache,
    private readonly notifications: NotificationService,
    private readonly otp: OtpService,
    private readonly banService: BanService,
  ) {
    this.googleClientId = config.get<string>('app.google.clientId', '');
    this.googleClient = this.googleClientId ? new OAuth2Client(this.googleClientId) : null;
  }

  // ─── Register ─────────────────────────────────────────────────────────────

  async register(dto: RegisterDto, ip?: string, ua?: string): Promise<{ message: string }> {
    await this.recaptcha.verify(dto.recaptchaToken);

    const authSettings = await this.settingsCache.get(SETTING_KEYS.AUTH);
    if (!authSettings.is_registration_enabled) {
      throw new BadRequestException(messages.auth.registrationDisabled);
    }

    const exists = await this.repo.findUserByEmail(dto.email);
    if (exists) throw new ConflictException(messages.auth.emailAlreadyExists);

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.repo.createUser({ email: dto.email, password: passwordHash, name: dto.name });

    if (authSettings.is_email_verification_required) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await this.repo.createEmailVerificationToken(user.id, tokenHash, expiresAt);
      await this.email.sendEmailVerification(user.email, user.name, token);
    }

    this.notifyAdminUserRegistered(user.name, user.email);
    return { message: messages.auth.registerSuccess };
  }

  private notifyAdminUserRegistered(name: string, email: string): void {
    void this.notifications.sendToAdmins(
      'admin.user_registered',
      'New User Registered',
      `${name} (${email}) has just created an account.`,
      { user_name: name, user_email: email },
    );
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, res: Response, ip?: string, ua?: string) {
    await this.recaptcha.verify(dto.recaptchaToken);
    const user = await this.repo.findUserByEmail(dto.email);

    const authSettings = await this.settingsCache.get(SETTING_KEYS.AUTH);
    const maxAttempts = authSettings.max_login_attempts;
    const lockoutMinutes = authSettings.lockout_duration_minutes;

    if (!user || !user.is_active) {
      await this.repo.createUserActivity({ type: 'LOGIN', email: dto.email, success: false, reason: 'user_not_found', ip_address: ip, user_agent: ua });
      throw new UnauthorizedException(messages.auth.invalidCredentials);
    }

    if (user.locked_until && user.locked_until > new Date()) {
      throw new UnauthorizedException(messages.auth.accountLocked);
    }

    const isBanned = await this.banService.isUserBanned(user.id);
    if (isBanned) {
      throw new UnauthorizedException('Your account has been banned. Please contact support.');
    }

    if (authSettings.is_email_verification_required && !user.email_verified_at) {
      throw new UnauthorizedException(messages.auth.emailNotVerified);
    }

    if (!user.password) {
      throw new UnauthorizedException(messages.auth.invalidCredentials);
    }

    const valid = await argon2.verify(user.password, dto.password);
    if (!valid) {
      const attempts = user.failed_login_attempts + 1;
      const locked_until = attempts >= maxAttempts
        ? new Date(Date.now() + lockoutMinutes * 60 * 1000)
        : null;
      await this.repo.updateUser(user.id, { failed_login_attempts: attempts, locked_until: locked_until ?? undefined });
      await this.repo.createUserActivity({ user_id: user.id, type: 'LOGIN', email: dto.email, success: false, reason: 'invalid_password', ip_address: ip, user_agent: ua });
      throw new UnauthorizedException(messages.auth.invalidCredentials);
    }

    await this.repo.updateUser(user.id, { failed_login_attempts: 0, locked_until: null });

    if (user.totp_enabled) {
      const partialToken = this.jwt.sign({ sub: user.id, type: 'partial' }, { expiresIn: '10m', secret: this.config.get('app.jwt.accessSecret') });
      return { requiresTwoFactor: true, partialToken };
    }

    await this.repo.createUserActivity({ user_id: user.id, type: 'LOGIN', email: dto.email, success: true, ip_address: ip, user_agent: ua });
    return this.issueTokens(user.id, res, ip, ua);
  }

  // ─── Google Auth ───────────────────────────────────────────────────────────────

  async googleAuth(dto: GoogleAuthDto, res: Response, ip?: string, ua?: string) {
    if (!this.googleClient) {
      throw new ServiceUnavailableException('Google Login is not configured on this server.');
    }
    const ticket = await this.googleClient.verifyIdToken({ idToken: dto.credential, audience: this.googleClientId }).catch(() => { throw new UnauthorizedException(messages.auth.googleTokenInvalid); });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) throw new UnauthorizedException(messages.auth.googleTokenInvalid);

    let user = (await this.repo.findOAuthAccount('google', payload.sub)) ? await this.repo.findUserByEmail(payload.email) : null;

    if (!user) {
      user = await this.repo.findUserByEmail(payload.email);
      if (user) {
        await this.repo.createOAuthAccount(user.id, 'google', payload.sub);
      } else {
        user = await this.repo.createUser({ email: payload.email, name: payload.name ?? payload.email, email_verified_at: new Date() });
        await this.repo.createOAuthAccount(user.id, 'google', payload.sub);
      }
    }

    const isBanned = await this.banService.isUserBanned(user.id);
    if (isBanned) {
      throw new UnauthorizedException('Your account has been banned. Please contact support.');
    }

    if (!user.email_verified_at) {
      await this.repo.updateUser(user.id, { email_verified_at: new Date() });
    }

    await this.repo.createUserActivity({ user_id: user.id, type: 'LOGIN', email: user.email, success: true, ip_address: ip, user_agent: ua });
    return this.issueTokens(user.id, res, ip, ua);
  }

  // ─── Token Management ─────────────────────────────────────────────────────

  async refresh(rawToken: string, res: Response, ip?: string, ua?: string) {
    if (!rawToken) throw new UnauthorizedException(messages.auth.refreshTokenInvalid);

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = await this.repo.findRefreshToken(tokenHash);

    if (!record || record.revoked_at || record.expires_at < new Date()) {
      if (record?.replaced_by) await this.repo.revokeAllUserRefreshTokens(record.user_id);
      this.clearAuthCookies(res);
      throw new UnauthorizedException(messages.auth.refreshTokenInvalid);
    }

    const isBanned = await this.banService.isUserBanned(record.user_id);
    if (isBanned) {
      this.clearAuthCookies(res);
      throw new UnauthorizedException('Your account has been banned. Please contact support.');
    }

    const newRaw = crypto.randomBytes(40).toString('hex');
    const newHash = crypto.createHash('sha256').update(newRaw).digest('hex');
    const days = this.config.get<number>('app.jwt.refreshExpiresDays', 7);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await this.repo.rotateRefreshToken(tokenHash, newHash, expiresAt);

    const accessToken = this.signAccessToken(record.user_id);
    this.setAuthCookies(res, accessToken, newRaw, expiresAt);
    return { message: 'Token refreshed' };
  }

  async logout(res: Response): Promise<void> {
    const rawToken = res.req.cookies?.refresh_token as string | undefined;
    if (rawToken) {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await this.repo.revokeRefreshToken(tokenHash);
    }
    this.clearAuthCookies(res);
  }

  // ─── Email Verification ───────────────────────────────────────────────────

  async verifyEmail(rawToken: string): Promise<{ message: string }> {
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = await this.repo.findEmailVerificationToken(hash);
    if (!record || record.used_at || record.expires_at < new Date()) throw new BadRequestException(messages.auth.invalidToken);
    await this.repo.consumeEmailVerificationToken(record.id);
    await this.repo.updateUser(record.user_id, { email_verified_at: new Date() });
    return { message: messages.auth.emailVerified };
  }

  // ─── Email Change ─────────────────────────────────────────────────────────

  async requestEmailChange(userId: string, dto: RequestEmailChangeDto) {
    const user = await this.repo.findUserById(userId);
    if (!user || !user.password) throw new BadRequestException('User not found or no password set.');

    const valid = await argon2.verify(user.password, dto.password);
    if (!valid) throw new BadRequestException('Invalid password.');

    const exists = await this.repo.findUserByEmail(dto.new_email);
    if (exists) throw new ConflictException('Email already in use.');

    const result = await this.otp.sendOtp({
      userId,
      purpose: 'email_change',
      toEmail: dto.new_email,
      toName: user.name,
      ttlMinutes: 15,
    });

    if (!result.sent) {
      throw new BadRequestException(`Please wait ${result.cooldownSeconds} seconds before requesting a new OTP.`);
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.repo.createPendingEmailChange(userId, dto.new_email, expiresAt);

    return { message: 'OTP sent to your new email.' };
  }

  async verifyEmailChange(userId: string, dto: VerifyEmailChangeOtpDto) {
    const user = await this.repo.findUserById(userId);
    if (!user || !user.password) throw new BadRequestException('User not found or no password set.');

    const validPwd = await argon2.verify(user.password, dto.password);
    if (!validPwd) throw new BadRequestException('Invalid password.');

    // Verify OTP first
    const validOtp = await this.otp.verifyOtp({ userId, purpose: 'email_change', code: dto.otp });
    if (!validOtp) throw new BadRequestException('Invalid or expired OTP.');

    const pending = await this.repo.findPendingEmailChangeByUserId(userId);
    
    if (!pending || pending.new_email !== dto.new_email) {
      throw new BadRequestException('Invalid email change request.');
    }

    await this.repo.updateUser(userId, { email: pending.new_email });
    await this.repo.deletePendingEmailChange(pending.id);

    void this.notifications.send({
      type:    'account.email_changed',
      userId:  userId,
      title:   'Email Address Changed',
      message: `Your account email address was changed to ${pending.new_email}.`,
    });

    return { message: 'Email successfully changed.' };
  }

  // ─── Password Reset ───────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.recaptcha.verify(dto.recaptchaToken);
    const user = await this.repo.findUserByEmail(dto.email);
    if (user) {
      const raw = crypto.randomBytes(32).toString('hex');
      const hash = crypto.createHash('sha256').update(raw).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await this.repo.createPasswordResetToken(user.id, hash, expiresAt);
      await this.email.sendPasswordReset(user.email, user.name, raw);
    }
    return { message: messages.auth.passwordResetSent };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const hash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const record = await this.repo.findPasswordResetToken(hash);
    if (!record || record.used_at || record.expires_at < new Date()) throw new BadRequestException(messages.auth.invalidToken);
    const passwordHash = await argon2.hash(dto.password);
    await this.repo.consumePasswordResetToken(record.id);
    await this.repo.updateUser(record.user_id, { password: passwordHash });
    await this.repo.revokeAllUserRefreshTokens(record.user_id);
    void this.notifications.send({
      type:    'account.password_changed',
      userId:  record.user_id,
      title:   'Password Changed',
      message: 'Your account password has been changed. If you did not do this, please contact support immediately.',
    });
    return { message: messages.auth.passwordResetSuccess };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private signAccessToken(userId: string): string {
    return this.jwt.sign({ sub: userId, type: 'access' }, { expiresIn: this.config.get('app.jwt.accessExpires', '15m'), secret: this.config.get('app.jwt.accessSecret') });
  }

  setAuthCookies(res: Response, accessToken: string, refreshToken: string, refreshExpiresAt: Date): void {
    res.cookie('access_token', accessToken, { ...COOKIE_DEFAULTS, maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { ...COOKIE_DEFAULTS, maxAge: refreshExpiresAt.getTime() - Date.now(), path: '/auth/refresh' });
  }

  clearAuthCookies(res: Response): void {
    res.clearCookie('access_token', { ...COOKIE_DEFAULTS });
    res.clearCookie('refresh_token', { ...COOKIE_DEFAULTS, path: '/auth/refresh' });
  }

  async issueTokens(userId: string, res: Response, ip?: string, ua?: string) {
    const accessToken = this.signAccessToken(userId);
    const raw = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    const days = this.config.get<number>('app.jwt.refreshExpiresDays', 7);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await this.repo.createRefreshToken({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt, ip_address: ip, user_agent: ua });
    this.setAuthCookies(res, accessToken, raw, expiresAt);
    void this.notifications.send({
      type:    'account.login_alert',
      userId,
      title:   'New Login Detected',
      message: `Your account was accessed from${ip ? ` IP ${ip}` : ' a new device'}.`,
      data:    { ip, userAgent: ua },
    });
    return { message: messages.auth.loginSuccess };
  }
}
