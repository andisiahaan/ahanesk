import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { setupE2EApp } from './e2e-setup';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import * as argon2 from 'argon2';

describe('SettingsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminAgent: request.SuperAgentTest;
  let userAgent: request.SuperAgentTest;
  let publicAgent: request.SuperAgentTest;
  
  let adminCsrfToken: string;
  let userCsrfToken: string;

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;
    prisma = setup.prisma;

    // Cleanup and create test users
    await prisma.user.deleteMany({ where: { email: { in: ['e2e_settings_admin@example.com', 'e2e_settings_user@example.com'] } } });
    
    const passwordHash = await argon2.hash('password123');
    await prisma.user.create({
      data: { email: 'e2e_settings_admin@example.com', name: 'Admin', password: passwordHash, role: 'ADMIN', email_verified_at: new Date(), is_active: true }
    });
    await prisma.user.create({
      data: { email: 'e2e_settings_user@example.com', name: 'User', password: passwordHash, role: 'USER', email_verified_at: new Date(), is_active: true }
    });

    // Create test setting
    await prisma.setting.deleteMany({ where: { key: 'site_title' } });
    await prisma.setting.create({
      data: { key: 'site_title', settings: { value: 'Ahansk Admin Panel' } }
    });

    adminAgent = request.agent(app.getHttpServer());
    userAgent = request.agent(app.getHttpServer());
    publicAgent = request.agent(app.getHttpServer());

    // 1. Get CSRF token for admin
    let res = await adminAgent.get('/');
    let cookies = res.headers['set-cookie'] || [];
    adminCsrfToken = cookies.find((c: string) => c.startsWith('csrf_token='))?.split(';')[0].split('=')[1];

    // 2. Login admin
    await adminAgent
      .post('/auth/login')
      .set('x-csrf-token', adminCsrfToken)
      .send({ email: 'e2e_settings_admin@example.com', password: 'password123' })
      .expect(200);

    // 3. Get CSRF token for user
    res = await userAgent.get('/');
    cookies = res.headers['set-cookie'] || [];
    userCsrfToken = cookies.find((c: string) => c.startsWith('csrf_token='))?.split(';')[0].split('=')[1];

    // 4. Login user
    await userAgent
      .post('/auth/login')
      .set('x-csrf-token', userCsrfToken)
      .send({ email: 'e2e_settings_user@example.com', password: 'password123' })
      .expect(200);
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Public Flow', () => {
    it('should get a setting by key publicly', async () => {
      const res = await publicAgent.get('/settings/site_title').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.settings.value).toBeDefined();
    });
  });

  describe('Admin Flow', () => {
    it('should prevent non-admin from updating setting', async () => {
      await userAgent
        .patch('/settings/site_title')
        .set('x-csrf-token', userCsrfToken)
        .send({ settings: { value: 'Hacked Title' } })
        .expect(403);
    });

    it('should allow admin to update a setting', async () => {
      const res = await adminAgent
        .patch('/settings/site_title')
        .set('x-csrf-token', adminCsrfToken)
        .send({ settings: { value: 'Ahansk Admin Panel Updated' } })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.settings.value).toBe('Ahansk Admin Panel Updated');
      
      // Clean up / revert
      await adminAgent
        .patch('/settings/site_title')
        .set('x-csrf-token', adminCsrfToken)
        .send({ settings: { value: 'Ahansk Admin Panel' } })
        .expect(200);
    });
  });
});
