import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { QUEUE_EMAIL } from '@ahanesk/shared';
import type { EmailJob } from '../infrastructure/email/email.service';

@Processor(QUEUE_EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    super();
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('app.smtp.host'),
      port: this.config.get<number>('app.smtp.port'),
      auth: {
        user: this.config.get<string>('app.smtp.user') || undefined,
        pass: this.config.get<string>('app.smtp.pass') || undefined,
      },
    });
  }

  async process(job: Job<EmailJob>): Promise<void> {
    const data = job.data;
    try {
      if (data.type === 'email-verification') {
        await this.sendVerification(data.to, data.name, data.token);
      } else if (data.type === 'password-reset') {
        await this.sendPasswordReset(data.to, data.name, data.token);
      }
    } catch (err) {
      this.logger.error(`Failed to send email [${data.type}] to ${data.to}`, err);
      throw err;
    }
  }

  private async sendVerification(to: string, name: string, token: string): Promise<void> {
    const frontendUrl = this.config.get<string>('app.cors.frontendUrl');
    const link = `${frontendUrl}/auth/verify-email?token=${token}`;
    await this.transporter.sendMail({
      from: `"${this.config.get<string>('app.smtp.fromName')}" <${this.config.get<string>('app.smtp.fromAddress')}>`,
      to,
      subject: 'Verify your email address',
      html: `<p>Hello ${name},</p><p>Please verify your email by clicking <a href="${link}">here</a>.</p><p>This link expires in 24 hours.</p>`,
    });
  }

  private async sendPasswordReset(to: string, name: string, token: string): Promise<void> {
    const frontendUrl = this.config.get<string>('app.cors.frontendUrl');
    const link = `${frontendUrl}/auth/reset-password?token=${token}`;
    await this.transporter.sendMail({
      from: `"${this.config.get<string>('app.smtp.fromName')}" <${this.config.get<string>('app.smtp.fromAddress')}>`,
      to,
      subject: 'Reset your password',
      html: `<p>Hello ${name},</p><p>Click <a href="${link}">here</a> to reset your password.</p><p>This link expires in 1 hour.</p>`,
    });
  }
}
