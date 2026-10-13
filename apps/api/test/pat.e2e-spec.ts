import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupE2EApp } from './e2e-setup';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import * as argon2 from 'argon2';

describe('PatController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminAgent: request.SuperAgentTest;
  let userAgent: request.SuperAgentTest;
  
  let adminCsrfToken: string;
  let userCsrfToken: string;
  let adminUserId: string;
  let normalUserId: string;
  let patId: string;
  let rawToken: string;

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;
    prisma = setup.prisma;

    // Cleanup and create test users
    await prisma.user.deleteMany({ where: { email: { startsWith: 'e2e_pat_' } } });
    
    const passwordHash = await argon2.hash('password123');
    
    const admin = await prisma.user.create({
      data: { email: 'e2e_pat_admin@example.com', name: 'Admin', password: passwordHash, role: 'ADMIN', email_verified_at: new Date(), is_active: true }
    });
    adminUserId = admin.id;

    const user = await prisma.user.create({
      data: { email: 'e2e_pat_user@example.com', name: 'User', password: passwordHash, role: 'USER', email_verified_at: new Date(), is_active: true }
    });
    normalUserId = user.id;

    adminAgent = request.agent(app.getHttpServer());
    userAgent = request.agent(app.getHttpServer());

    // Login Admin
    let res = await adminAgent.get('/');
    let cookies = res.headers['set-cookie'] || [];
    adminCsrfToken = cookies.find((c: string) => c.startsWith('csrf_token='))?.split(';')[0].split('=')[1];

    await adminAgent
      .post('/auth/login')
      .set('x-csrf-token', adminCsrfToken)
      .send({ email: 'e2e_pat_admin@example.com', password: 'password123' })
      .expect(200);

    // Login User
    res = await userAgent.get('/');
    cookies = res.headers['set-cookie'] || [];
    userCsrfToken = cookies.find((c: string) => c.startsWith('csrf_token='))?.split(';')[0].split('=')[1];

    await userAgent
      .post('/auth/login')
      .set('x-csrf-token', userCsrfToken)
      .send({ email: 'e2e_pat_user@example.com', password: 'password123' })
      .expect(200);
  }, 30000);

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('User PAT Flow', () => {
    it('should create a PAT for user', async () => {
      const res = await userAgent
        .post('/personal-access-tokens')
        .set('x-csrf-token', userCsrfToken)
        .send({
          name: 'My Test Token'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('My Test Token');
      expect(res.body.data.token).toBeDefined(); // Plaintext returned once
      
      patId = res.body.data.id;
      rawToken = res.body.data.token;
    });

    it('should list PATs for user', async () => {
      const res = await userAgent.get('/personal-access-tokens').expect(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((t: any) => t.id === patId)).toBe(true);
      
      // Token shouldn't be returned in list
      const tokenInList = res.body.data.find((t: any) => t.id === patId);
      expect(tokenInList.token).toBeUndefined();
    });
  });

  describe('Admin PAT Flow', () => {
    it('should list all PATs as admin', async () => {
      const res = await adminAgent.get('/admin/personal-access-tokens').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.meta).toBeDefined();
      expect(res.body.data.items.some((t: any) => t.id === patId)).toBe(true);
    });

    it('should prevent user from accessing admin PAT list', async () => {
      await userAgent.get('/admin/personal-access-tokens').expect(403);
    });

    it('should allow admin to revoke any PAT', async () => {
      await adminAgent
        .delete(`/admin/personal-access-tokens/${patId}`)
        .set('x-csrf-token', adminCsrfToken)
        .expect(204);

      // Verify revoked by checking list
      const res = await adminAgent.get('/admin/personal-access-tokens').expect(200);
      const revokedPat = res.body.data.items.find((t: any) => t.id === patId);
      expect(revokedPat).toBeDefined();
      expect(revokedPat.revoked_at).not.toBeNull();
    });
  });

  describe('User Revoke Flow', () => {
    let newPatId: string;

    it('should allow user to revoke their own PAT', async () => {
      // Create another one
      const res = await userAgent
        .post('/personal-access-tokens')
        .set('x-csrf-token', userCsrfToken)
        .send({ name: 'Token to Revoke' })
        .expect(201);
      
      newPatId = res.body.data.id;

      // Revoke
      await userAgent
        .delete(`/personal-access-tokens/${newPatId}`)
        .set('x-csrf-token', userCsrfToken)
        .expect(204);
    });

    it('should prevent user from revoking someone elses PAT', async () => {
      // Admin creates one
      const res = await adminAgent
        .post('/personal-access-tokens')
        .set('x-csrf-token', adminCsrfToken)
        .send({ name: 'Admin Token' })
        .expect(201);
      
      const adminPatId = res.body.data.id;

      // User tries to revoke
      await userAgent
        .delete(`/personal-access-tokens/${adminPatId}`)
        .set('x-csrf-token', userCsrfToken)
        .expect(404); // returns 404 because not found in user's tokens
    });
  });
});
