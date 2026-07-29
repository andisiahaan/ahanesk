import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { AuthUser } from '@ahanesk/shared';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
  type: 'access' | 'partial';
}

// Extract JWT from httpOnly cookie first, fallback to Bearer header (for /v1/* API clients)
function cookieOrBearerExtractor(req: Request): string | null {
  if (req?.cookies?.access_token) return req.cookies.access_token as string;
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: cookieOrBearerExtractor,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('app.jwt.accessSecret', ''),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.type === 'partial') {
      throw new UnauthorizedException('Partial token cannot access this resource');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, is_active: true },
      select: { id: true, email: true, name: true, role: true, totp_enabled: true },
    });

    if (!user) throw new UnauthorizedException('User not found or inactive');

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      twoFactorEnabled: user.totp_enabled,
    };
  }
}
