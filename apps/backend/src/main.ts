import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import cookieParser = require('cookie-parser');
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe';
import helmet from 'helmet';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // ─── Logger ─────────────────────────────────────────────────────────────────
  const logger = app.get(Logger);
  app.useLogger(logger);

  // ─── Security (Helmet) ──────────────────────────────────────────────────────
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // ─── Cookie Parser ──────────────────────────────────────────────────────────
  app.use(cookieParser());

  // ─── CSRF Token Middleware (Double Submit Cookie) ───────────────────────────
  app.use((req: any, res: any, next: () => void) => {
    let csrfToken = req.cookies['csrf_token'];
    if (!csrfToken) {
      // In production, use crypto.randomBytes(32).toString('hex')
      csrfToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      res.cookie('csrf_token', csrfToken, {
        httpOnly: false, // Must be readable by frontend JS
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }

    // Require CSRF token on state-changing requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const tokenInHeader = req.headers['x-csrf-token'];
      if (!tokenInHeader || tokenInHeader !== csrfToken) {
        return res.status(403).json({ success: false, message: 'Invalid CSRF Token' });
      }
    }
    next();
  });

  // ─── CORS ───────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL ?? 'http://localhost:10312',
      process.env.ADMIN_URL ?? 'http://localhost:10313',
    ],
    credentials: true,
  });

  // ─── Global Pipes ───────────────────────────────────────────────────────────
  app.useGlobalPipes(new ZodValidationPipe());

  // ─── Global Guards ──────────────────────────────────────────────────────────
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  // ─── Global Filters ─────────────────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ─── Global Interceptors ────────────────────────────────────────────────────
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ─── Start ──────────────────────────────────────────────────────────────────
  const port = parseInt(process.env.PORT ?? '10311', 10);
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Backend running on http://0.0.0.0:${port}`, 'Bootstrap');
}

bootstrap();

