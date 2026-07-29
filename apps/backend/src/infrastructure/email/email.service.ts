import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_EMAIL } from '@ahanesk/shared';

export interface EmailVerificationJob {
  type: 'email-verification';
  to: string;
  name: string;
  token: string;
}

export interface PasswordResetJob {
  type: 'password-reset';
  to: string;
  name: string;
  token: string;
}

export interface OtpEmailJob {
  type: 'otp';
  to: string;
  name: string;
  code: string;
  purpose: string;
  expiresAt: Date;
}

export type EmailJob = EmailVerificationJob | PasswordResetJob | OtpEmailJob;

@Injectable()
export class EmailService {
  constructor(@InjectQueue(QUEUE_EMAIL) private readonly emailQueue: Queue) {}

  async sendEmailVerification(to: string, name: string, token: string): Promise<void> {
    await this.emailQueue.add('send', {
      type: 'email-verification',
      to,
      name,
      token,
    } satisfies EmailVerificationJob);
  }

  async sendPasswordReset(to: string, name: string, token: string): Promise<void> {
    await this.emailQueue.add('send', {
      type: 'password-reset',
      to,
      name,
      token,
    } satisfies PasswordResetJob);
  }

  async sendOtpEmail(to: string, name: string, code: string, purpose: string, expiresAt: Date): Promise<void> {
    await this.emailQueue.add('send', {
      type: 'otp',
      to,
      name,
      code,
      purpose,
      expiresAt,
    } satisfies OtpEmailJob);
  }
}
