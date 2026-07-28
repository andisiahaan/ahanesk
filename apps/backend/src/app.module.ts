import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvAdapter from '@keyv/redis';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { RecaptchaModule } from './infrastructure/recaptcha/recaptcha.module';
import { SettingsCacheModule } from './infrastructure/settings/settings-cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PagesModule } from './modules/pages/pages.module';
import { PatModule } from './modules/personal-access-tokens/pat.module';
import { BlogModule } from './modules/blog/blog.module';
import { NewsModule } from './modules/news/news.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { HelpModule } from './modules/help/help.module';
import { OtpModule } from './modules/otp/otp.module';
import { EmailProcessor } from './jobs/email.processor';
import { QUEUE_EMAIL } from '@ahansk/shared';

@Module({
  imports: [
    // ─── Config ───────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),

    // ─── Logger (Pino) ────────────────────────────────────────────────────────
    LoggerModule.forRoot({
      pinoHttp: {
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie', 'req.body.password', 'req.body.token', 'req.body.refreshToken'],
          censor: '[REDACTED]',
        },
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),

    // ─── Rate Limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),

    // ─── Queue (BullMQ + Redis) ───────────────────────────────────────────────
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: { url: process.env.REDIS_URL },
      }),
    }),
    BullModule.registerQueue({ name: QUEUE_EMAIL }),

    // ─── Cache (Redis, namespace: cache:*) ────────────────────────────────────
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => {
        let redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        try {
          const urlObj = new URL(redisUrl);
          urlObj.pathname = '/1';
          redisUrl = urlObj.toString();
        } catch (e) {
          redisUrl = redisUrl.replace(/\/$/, '') + '/1';
        }
        return {
          store: new KeyvAdapter(redisUrl, { namespace: 'cache' }),
          ttl: 0,
        };
      },
    }),


    // ─── Infrastructure ───────────────────────────────────────────────────────────
    PrismaModule,
    StorageModule,
    RecaptchaModule,
    SettingsCacheModule,

    // ─── Feature Modules ──────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    SettingsModule,
    PagesModule,
    PatModule,
    BlogModule,
    NewsModule,
    TicketsModule,
    NotificationModule,
    HelpModule,
    OtpModule,
  ],
  providers: [EmailProcessor],
})
export class AppModule {}
