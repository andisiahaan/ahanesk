import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';

export interface NotificationEmailJob {
  userId:  number | bigint;
  type:    string;
  title:   string;
  message: string;
  url?:    string;
  to:      string;
  name:    string;
}

@Processor('notification-email')
export class NotificationEmailProcessor extends WorkerHost {
  private readonly logger      = new Logger(NotificationEmailProcessor.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    super();
    this.transporter = nodemailer.createTransport({
      host:   this.config.get<string>('app.smtp.host'),
      port:   this.config.get<number>('app.smtp.port'),
      secure: this.config.get<number>('app.smtp.port') === 465,
      auth: {
        user: this.config.get<string>('app.smtp.user') || undefined,
        pass: this.config.get<string>('app.smtp.pass') || undefined,
      },
    });
  }

  async process(job: Job<NotificationEmailJob>): Promise<void> {
    const { to, name, title, message, url } = job.data;
    try {
      await this.transporter.sendMail({
        from:    `"${this.config.get<string>('app.smtp.fromName')}" <${this.config.get<string>('app.smtp.fromAddress')}>`,
        to,
        subject: title,
        html:    this.buildHtml(name, title, message, url),
      });
    } catch (err) {
      this.logger.error(`[notification:email] Failed to ${to}`, err);
      throw err;
    }
  }

  private buildHtml(name: string, title: string, message: string, url?: string): string {
    const actionBtn = url
      ? `<p style="text-align:center;margin:24px 0"><a href="${url}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">${title}</a></p>`
      : '';
    return `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;background:#f8f9fa;margin:0;padding:32px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb">
  <h2 style="color:#111827;margin-top:0">${title}</h2>
  <p style="color:#374151">Hello ${name},</p>
  <p style="color:#374151">${message}</p>
  ${actionBtn}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
  <p style="color:#9ca3af;font-size:12px">You received this email because you have notifications enabled. <a href="${url ?? '#'}" style="color:#6b7280">Manage preferences</a></p>
</div></body></html>`;
  }
}
