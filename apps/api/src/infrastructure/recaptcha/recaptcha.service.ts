import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { messages } from '@ahanesk/shared';

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

@Injectable()
export class RecaptchaService {
  private readonly secretKey: string;

  constructor(private readonly config: ConfigService) {
    this.secretKey = this.config.get<string>('app.recaptcha.secretKey', '');
  }

  get isEnabled(): boolean {
    return this.secretKey.length > 0;
  }

  async verify(token: string | undefined): Promise<void> {
    if (!this.isEnabled) return;

    if (!token) {
      throw new BadRequestException(messages.common.recaptchaInvalid);
    }

    const params = new URLSearchParams({ secret: this.secretKey, response: token });
    const res = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?${params}`,
      { method: 'POST' },
    );
    const data = (await res.json()) as RecaptchaResponse;

    if (!data.success) {
      throw new BadRequestException(messages.common.recaptchaInvalid);
    }
  }
}
