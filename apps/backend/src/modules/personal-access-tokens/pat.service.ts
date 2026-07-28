import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PatRepository } from './pat.repository';
import { buildPaginationMeta } from '@ahansk/shared';
import type { CreatePatDto } from './pat.dto';

@Injectable()
export class PatService {
  constructor(private readonly repo: PatRepository) {}

  listForUser(userId: string) {
    return this.repo.findAllByUser(userId);
  }

  async listAll(page: number, limit: number) {
    const [tokens, total] = await this.repo.findAll(page, limit);
    return { items: tokens, meta: buildPaginationMeta(total, page, limit) };
  }

  /** Creates a PAT. Returns the plaintext token — stored ONCE, never again. */
  async create(userId: string, dto: CreatePatDto) {
    const rawToken  = `sk_${randomBytes(32).toString('hex')}`;
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const prefix    = rawToken.slice(0, 10); // "sk_" + 7 chars

    const token = await this.repo.create({
      user_id:     userId,
      name:        dto.name,
      token_hash:  tokenHash,
      token_prefix: prefix,
      expires_at:  dto.expires_at ?? null,
    });

    return { ...token, token: rawToken }; // plaintext returned ONCE
  }

  async revoke(id: string, userId: string, isAdmin = false) {
    const tokens = await this.repo.findAllByUser(userId);
    const found  = tokens.find((t: { id: string }) => t.id === id);
    if (!found && !isAdmin) throw new NotFoundException('Token not found');
    return this.repo.revoke(id);
  }

  /** Used by PATGuard — returns full token record or null */
  async validateToken(rawToken: string) {
    const hash  = createHash('sha256').update(rawToken).digest('hex');
    const token = await this.repo.findByHash(hash);
    if (!token || token.revoked_at) return null;
    if (token.expires_at && token.expires_at < new Date()) return null;
    this.repo.touchLastUsed(token.id); // fire-and-forget
    return token;
  }
}
