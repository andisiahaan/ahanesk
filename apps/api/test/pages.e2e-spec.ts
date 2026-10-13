import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { setupE2EApp } from './e2e-setup';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import * as argon2 from 'argon2';

describe('PagesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminAgent: request.SuperAgentTest;
  let publicAgent: request.SuperAgentTest;
  let adminCsrfToken: string;
  let pageId: string;

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;
    prisma = setup.prisma;

    // Cleanup and create test user
    await prisma.user.deleteMany({ where: { email: 'e2e_pages_admin@example.com' } });
    await prisma.page.deleteMany({ where: { slug: { startsWith: 'e2e-page' } } });
    
    const passwordHash = await argon2.hash('password123');
    await prisma.user.create({
      data: { email: 'e2e_pages_admin@example.com', name: 'Admin', password: passwordHash, role: 'ADMIN', email_verified_at: new Date(), is_active: true }
    });

    adminAgent = request.agent(app.getHttpServer());
    publicAgent = request.agent(app.getHttpServer());

    // Login admin
    let res = await adminAgent.get('/');
    let cookies = res.headers['set-cookie'] || [];
    adminCsrfToken = cookies.find((c: string) => c.startsWith('csrf_token='))?.split(';')[0].split('=')[1];

    await adminAgent
      .post('/auth/login')
      .set('x-csrf-token', adminCsrfToken)
      .send({ email: 'e2e_pages_admin@example.com', password: 'password123' })
      .expect(200);
  }, 30000);

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Admin Flow', () => {
    it('should create a page', async () => {
      const res = await adminAgent
        .post('/pages')
        .set('x-csrf-token', adminCsrfToken)
        .send({
          title: 'E2E Page 1',
          slug: 'e2e-page-1',
          content: '<p>Content</p>',
          is_published: false
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('e2e-page-1');
      pageId = res.body.data.id;
    });

    it('should get all pages as admin', async () => {
      const res = await adminAgent.get('/pages').expect(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((p: any) => p.id === pageId)).toBe(true);
    });

    it('should get a page by id', async () => {
      const res = await adminAgent.get(`/pages/id/${pageId}`).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(pageId);
    });

    it('should update a page to published', async () => {
      const res = await adminAgent
        .patch(`/pages/${pageId}`)
        .set('x-csrf-token', adminCsrfToken)
        .send({ is_published: true })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.is_published).toBe(true);
    });
  });

  describe('Public Flow', () => {
    it('should get a published page by slug', async () => {
      const res = await publicAgent.get('/pages/e2e-page-1').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('e2e-page-1');
      expect(res.body.data.is_published).toBe(true);
    });

    it('should not get an unpublished page by slug without preview', async () => {
      // Create unpublished page
      const res = await adminAgent
        .post('/pages')
        .set('x-csrf-token', adminCsrfToken)
        .send({
          title: 'E2E Page 2',
          slug: 'e2e-page-2',
          content: '<p>Draft</p>',
          is_published: false
        })
        .expect(201);

      // Try to get as public
      await publicAgent.get('/pages/e2e-page-2').expect(404);
    });

    it('should get an unpublished page with preview query', async () => {
      const res = await publicAgent.get('/pages/e2e-page-2?preview=true').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('e2e-page-2');
    });
  });

  describe('Cleanup', () => {
    it('should delete a page as admin', async () => {
      await adminAgent
        .delete(`/pages/${pageId}`)
        .set('x-csrf-token', adminCsrfToken)
        .expect(204);
    });
  });
});
