import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE_EMAIL } from '@ahanesk/shared';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import cookieParser from 'cookie-parser';
import { ZodValidationPipe } from '../src/common/pipes/zod-validation.pipe';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { EmailProcessor } from '../src/jobs/email.processor';
import { NotificationEmailProcessor } from '../src/modules/notifications/channels/notification-email.processor';
import { NotificationPushProcessor } from '../src/modules/notifications/channels/notification-push.processor';
import { NotificationService } from '../src/modules/notifications/notification.service';
import crypto from 'crypto';

export interface E2ESetup {
  app: INestApplication;
  prisma: PrismaService;
}

export async function setupE2EApp(): Promise<E2ESetup> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(getQueueToken(QUEUE_EMAIL))
    .useValue({ add: jest.fn() })
    .overrideProvider(getQueueToken('notification-email'))
    .useValue({ add: jest.fn() })
    .overrideProvider(getQueueToken('notification-push'))
    .useValue({ add: jest.fn() })
    .overrideProvider(EmailProcessor)
    .useValue({})
    .overrideProvider(NotificationEmailProcessor)
    .useValue({})
    .overrideProvider(NotificationPushProcessor)
    .useValue({})
    .compile();

  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());

  // Basic CSRF middleware matching main.ts for E2E consistency
  app.use((req: any, res: any, next: any) => {
    let token = req.cookies['csrf_token'];
    if (!token) {
      token = crypto.randomBytes(32).toString('hex');
      res.cookie('csrf_token', token, { httpOnly: false, path: '/' });
    }
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const headerToken = req.headers['x-csrf-token'];
      if (!headerToken || headerToken !== token) {
        return res.status(403).json({ success: false, message: 'Invalid CSRF Token' });
      }
    }
    next();
  });

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  await app.init();

  const prisma = app.get<PrismaService>(PrismaService);
  return { app, prisma };
}

export async function teardownE2EApp(app?: INestApplication) {
  if (app) {
    await app.close();
  }
}
