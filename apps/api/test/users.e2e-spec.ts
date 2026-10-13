import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from './../src/infrastructure/prisma/prisma.service';
import { setupE2EApp, teardownE2EApp } from './e2e-setup';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let csrfToken: string;

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;
    prisma = setup.prisma;

    // Cleanup before tests
    await prisma.user.deleteMany({ where: { email: { startsWith: 'e2e_user' } } });

    // Setup an admin user for admin-only routes
    const passwordHash = await argon2.hash('admin123');
    const adminUser = await prisma.user.create({
      data: {
        email: 'e2e_user_admin@example.com',
        name: 'E2E Admin',
        password: passwordHash,
        role: 'ADMIN',
        email_verified_at: new Date(),
        is_active: true,
      }
    });

    // Get CSRF and Session
    const res = await request(app.getHttpServer()).get('/');
    const cookies = res.headers['set-cookie'] || [];
    const csrfCookie = cookies.find((c: string) => c.startsWith('csrf_token='));
    csrfToken = csrfCookie.split(';')[0].split('=')[1];

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Cookie', [`csrf_token=${csrfToken}`])
      .set('x-csrf-token', csrfToken)
      .send({ email: 'e2e_user_admin@example.com', password: 'admin123' })
      .expect(200);

    const loginCookies = loginRes.headers['set-cookie'] || [];
    const accessCookie = loginCookies.find((c: string) => c.startsWith('access_token='));
    adminToken = accessCookie.split(';')[0].split('=')[1];
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({ where: { email: { startsWith: 'e2e_user' } } });
    }
    await teardownE2EApp(app);
  });

  describe('/users (GET)', () => {
    it('should return paginated list of users', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.meta).toBeDefined();
    });

    it('should block non-admin access', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });
  });
});
