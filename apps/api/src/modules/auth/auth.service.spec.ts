import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../infrastructure/email/email.service';
import { RecaptchaService } from '../../infrastructure/recaptcha/recaptcha.service';
import { SettingsCache } from '../../infrastructure/settings/settings-cache.service';
import { NotificationService } from '../notifications/notification.service';
import { OtpService } from '../otp/otp.service';
import { BanService } from '../users/ban.service';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;

  const mockRepo = {
    findUserByEmail: jest.fn(),
    createUser: jest.fn(),
    createEmailVerificationToken: jest.fn(),
    createUserActivity: jest.fn(),
    updateUser: jest.fn(),
    findOAuthAccount: jest.fn(),
    createOAuthAccount: jest.fn(),
    findRefreshToken: jest.fn(),
    revokeAllUserRefreshTokens: jest.fn(),
    rotateRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    findEmailVerificationToken: jest.fn(),
    consumeEmailVerificationToken: jest.fn(),
    findUserById: jest.fn(),
    createPendingEmailChange: jest.fn(),
    findPendingEmailChangeByUserId: jest.fn(),
    deletePendingEmailChange: jest.fn(),
    createPasswordResetToken: jest.fn(),
    findPasswordResetToken: jest.fn(),
    consumePasswordResetToken: jest.fn(),
    createRefreshToken: jest.fn(),
  };

  const mockJwt = { sign: jest.fn(() => 'mock-jwt-token') };
  const mockConfig = { get: jest.fn((key) => key) };
  const mockEmail = { sendEmailVerification: jest.fn(), sendPasswordReset: jest.fn() };
  const mockRecaptcha = { verify: jest.fn() };
  const mockSettingsCache = { get: jest.fn() };
  const mockNotifications = { sendToAdmins: jest.fn(), send: jest.fn() };
  const mockOtp = { sendOtp: jest.fn(), verifyOtp: jest.fn() };
  const mockBanService = { isUserBanned: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockRepo },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: EmailService, useValue: mockEmail },
        { provide: RecaptchaService, useValue: mockRecaptcha },
        { provide: SettingsCache, useValue: mockSettingsCache },
        { provide: NotificationService, useValue: mockNotifications },
        { provide: OtpService, useValue: mockOtp },
        { provide: BanService, useValue: mockBanService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw BadRequestException if registration is disabled', async () => {
      mockRecaptcha.verify.mockResolvedValue(true);
      mockSettingsCache.get.mockResolvedValue({ is_registration_enabled: false });

      await expect(service.register({ email: 't@t.com', password: 'pw', name: 'Test', recaptchaToken: 'x' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if email exists', async () => {
      mockRecaptcha.verify.mockResolvedValue(true);
      mockSettingsCache.get.mockResolvedValue({ is_registration_enabled: true });
      mockRepo.findUserByEmail.mockResolvedValue({ id: '123' });

      await expect(service.register({ email: 't@t.com', password: 'pw', name: 'Test', recaptchaToken: 'x' }))
        .rejects.toThrow(ConflictException);
    });
  });
});
