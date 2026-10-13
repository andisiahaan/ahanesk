import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from './../src/infrastructure/prisma/prisma.service';
import { setupE2EApp, teardownE2EApp } from './e2e-setup';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let csrfToken: string;

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;
    prisma = setup.prisma;
    
    // Cleanup DB before tests
    await prisma.user.deleteMany({ where: { email: { startsWith: 'e2e_' } } });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({ where: { email: { startsWith: 'e2e_' } } });
    }
    await teardownE2EApp(app);
  });

  describe('/auth/register (POST)', () => {
    it('should require CSRF token', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'e2e_test@example.com', name: 'Test', password: 'password123' })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid CSRF Token');
        });
    });

    it('should register a new user successfully', async () => {
      // First get a CSRF token
      const res = await request(app.getHttpServer()).get('/');
      const cookies = res.headers['set-cookie'] || [];
      const csrfCookie = cookies.find((c: string) => c.startsWith('csrf_token='));
      expect(csrfCookie).toBeDefined();
      csrfToken = csrfCookie.split(';')[0].split('=')[1];

      // Now register
      await request(app.getHttpServer())
        .post('/auth/register')
        .set('Cookie', [`csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({ email: 'e2e_register@example.com', name: 'E2E Test', password: 'password123' })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should fail on duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .set('Cookie', [`csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({ email: 'e2e_register@example.com', name: 'E2E Test', password: 'password123' })
        .expect(409);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully and return access_token in cookie', async () => {
      // Manually verify email to allow login
      await prisma.user.update({
        where: { email: 'e2e_register@example.com' },
        data: { email_verified_at: new Date() }
      });

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .set('Cookie', [`csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({ email: 'e2e_register@example.com', password: 'password123' })
        .expect(200);

      expect(res.body.success).toBe(true);
      
      const cookies = res.headers['set-cookie'] || [];
      const hasAccessToken = cookies.some((c: string) => c.startsWith('access_token='));
      const hasRefreshToken = cookies.some((c: string) => c.startsWith('refresh_token='));
      
      expect(hasAccessToken).toBe(true);
      expect(hasRefreshToken).toBe(true);
    });
  });
});
