import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { User, OAuthAccount, RefreshToken, Prisma } from '@prisma/client';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── User ─────────────────────────────────────────────────────────────────

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: number | bigint): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: BigInt(id) } });
  }

  async createUser(data: {
    email: string;
    password?: string;
    name: string;
    email_verified_at?: Date;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async updateUser(id: number | bigint, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id: BigInt(id) }, data });
  }

  // ─── OAuth ────────────────────────────────────────────────────────────────

  async findOAuthAccount(provider: string, providerId: string): Promise<OAuthAccount | null> {
    return this.prisma.oAuthAccount.findUnique({
      where: { provider_provider_id: { provider, provider_id: providerId } },
    });
  }

  async createOAuthAccount(userId: number | bigint, provider: string, providerId: string): Promise<void> {
    await this.prisma.oAuthAccount.create({
      data: { user_id: BigInt(userId), provider, provider_id: providerId },
    });
  }

  // ─── Refresh Tokens ───────────────────────────────────────────────────────

  async createRefreshToken(data: {
    user_id: number | bigint;
    token_hash: string;
    expires_at: Date;
    user_agent?: string;
    ip_address?: string;
  }): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        ...data,
        user_id: BigInt(data.user_id),
      },
    });
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { token_hash: tokenHash } });
  }

  async rotateRefreshToken(oldHash: string, newHash: string, newExpiresAt: Date): Promise<void> {
    const old = await this.prisma.refreshToken.findUnique({ where: { token_hash: oldHash } });
    if (!old) return;

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { token_hash: oldHash },
        data: { replaced_by: newHash, revoked_at: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: {
          user_id: old.user_id,
          token_hash: newHash,
          expires_at: newExpiresAt,
        },
      }),
    ]);
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token_hash: tokenHash },
      data: { revoked_at: new Date() },
    });
  }

  async revokeAllUserRefreshTokens(userId: number | bigint): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { user_id: BigInt(userId), revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }

  // ─── Email Verification ───────────────────────────────────────────────────

  async createEmailVerificationToken(userId: number | bigint, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.emailVerificationToken.create({
      data: { user_id: BigInt(userId), token_hash: tokenHash, expires_at: expiresAt },
    });
  }

  async findEmailVerificationToken(tokenHash: string) {
    return this.prisma.emailVerificationToken.findUnique({ where: { token_hash: tokenHash }, include: { user: true } });
  }

  async consumeEmailVerificationToken(id: number | bigint): Promise<void> {
    await this.prisma.emailVerificationToken.update({ where: { id: BigInt(id) }, data: { used_at: new Date() } });
  }

  // ─── Password Reset ───────────────────────────────────────────────────────

  async createPasswordResetToken(userId: number | bigint, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.passwordResetToken.create({
      data: { user_id: BigInt(userId), token_hash: tokenHash, expires_at: expiresAt },
    });
  }

  async findPasswordResetToken(tokenHash: string) {
    return this.prisma.passwordResetToken.findUnique({ where: { token_hash: tokenHash }, include: { user: true } });
  }

  async consumePasswordResetToken(id: number | bigint): Promise<void> {
    await this.prisma.passwordResetToken.update({ where: { id: BigInt(id) }, data: { used_at: new Date() } });
  }

  // ─── TOTP ─────────────────────────────────────────────────────────────────

  async createTotpRecoveryCodes(userId: number | bigint, codeHashes: string[]): Promise<void> {
    await this.prisma.totpRecoveryCode.createMany({
      data: codeHashes.map((code_hash) => ({ user_id: BigInt(userId), code_hash })),
    });
  }

  async findUnusedRecoveryCodes(userId: number | bigint) {
    return this.prisma.totpRecoveryCode.findMany({ where: { user_id: BigInt(userId), used_at: null } });
  }

  async consumeRecoveryCode(id: number | bigint): Promise<void> {
    await this.prisma.totpRecoveryCode.update({ where: { id: BigInt(id) }, data: { used_at: new Date() } });
  }

  async deleteAllRecoveryCodes(userId: number | bigint): Promise<void> {
    await this.prisma.totpRecoveryCode.deleteMany({ where: { user_id: BigInt(userId) } });
  }

  // ─── User Activity ────────────────────────────────────────────────────────

  async createUserActivity(data: {
    user_id?: number | bigint;
    type: 'LOGIN';
    email: string;
    success: boolean;
    ip_address?: string;
    user_agent?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { user_id, metadata, ...rest } = data;
    await this.prisma.userActivity.create({
      data: {
        ...rest,
        ...(user_id ? { user: { connect: { id: BigInt(user_id) } } } : {}),
        ...(metadata ? { metadata: metadata as object } : {}),
      },
    });
  }

  // ─── Pending Email Change ───────────────────────────────────────────────────

  async createPendingEmailChange(userId: number | bigint, newEmail: string, expiresAt: Date) {
    await this.prisma.pendingEmailChange.deleteMany({ where: { user_id: BigInt(userId) } });
    const dummyHash = Date.now().toString() + String(userId); // satisfy unique constraint temporarily
    return this.prisma.pendingEmailChange.create({
      data: { user_id: BigInt(userId), new_email: newEmail, token_hash: dummyHash, expires_at: expiresAt },
    });
  }

  async findPendingEmailChangeByUserId(userId: number | bigint) {
    return this.prisma.pendingEmailChange.findFirst({
      where: { user_id: BigInt(userId) },
      include: { user: true },
    });
  }

  async deletePendingEmailChange(id: number | bigint) {
    await this.prisma.pendingEmailChange.delete({ where: { id: BigInt(id) } });
  }
}
