import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupE2EApp } from './e2e-setup';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import * as argon2 from 'argon2';

describe('NewsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminAgent: request.SuperAgentTest;
  let publicAgent: request.SuperAgentTest;
  
  let adminCsrfToken: string;
  let newsId: string;
  let newsSlug = 'e2e-news-slug';

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;
    prisma = setup.prisma;

    // Cleanup and create test user
    await prisma.user.deleteMany({ where: { email: 'e2e_news_admin@example.com' } });
    await prisma.newsItem.deleteMany({ where: { slug: { startsWith: 'e2e-news' } } });
    
    const passwordHash = await argon2.hash('password123');
    await prisma.user.create({
      data: { email: 'e2e_news_admin@example.com', name: 'Admin', password: passwordHash, role: 'ADMIN', email_verified_at: new Date(), is_active: true }
    });

    adminAgent = request.agent(app.getHttpServer());
    publicAgent = request.agent(app.getHttpServer());

    // Login Admin
    let res = await adminAgent.get('/');
    let cookies = res.headers['set-cookie'] || [];
    adminCsrfToken = cookies.find((c: string) => c.startsWith('csrf_token='))?.split(';')[0].split('=')[1];

    await adminAgent
      .post('/auth/login')
      .set('x-csrf-token', adminCsrfToken)
      .send({ email: 'e2e_news_admin@example.com', password: 'password123' })
      .expect(200);

  }, 30000);

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Admin News Flow', () => {
    it('should create a news item', async () => {
      const res = await adminAgent
        .post('/admin/news')
        .set('x-csrf-token', adminCsrfToken)
        .send({
          title: 'E2E News',
          slug: newsSlug,
          content: 'E2E News Content',
          type: 'ANNOUNCEMENT',
          is_published: false
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe(newsSlug);
      expect(res.body.data.type).toBe('ANNOUNCEMENT');
      newsId = res.body.data.id;
    });

    it('should list all news as admin', async () => {
      const res = await adminAgent.get('/admin/news').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.meta).toBeDefined();
      expect(res.body.data.items.some((n: any) => n.id === newsId)).toBe(true);
    });

    it('should get a news item by id as admin', async () => {
      const res = await adminAgent.get(`/admin/news/${newsId}`).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(newsId);
    });

    it('should update a news item to published', async () => {
      const res = await adminAgent
        .patch(`/admin/news/${newsId}`)
        .set('x-csrf-token', adminCsrfToken)
        .send({ is_published: true })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.is_published).toBe(true);
    });
  });

  describe('Public News Flow', () => {
    it('should list published news publicly', async () => {
      const res = await publicAgent.get('/news').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.meta).toBeDefined();
      expect(res.body.data.items.some((n: any) => n.id === newsId)).toBe(true);
    });

    it('should get a published news by slug publicly', async () => {
      const res = await publicAgent.get(`/news/${newsSlug}`).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe(newsSlug);
    });

    it('should not get an unpublished news publicly', async () => {
      // Create draft
      const res = await adminAgent
        .post('/admin/news')
        .set('x-csrf-token', adminCsrfToken)
        .send({
          title: 'E2E Draft',
          slug: 'e2e-news-draft',
          content: 'E2E News Content',
          type: 'UPDATE',
          is_published: false
        })
        .expect(201);
      
      const draftSlug = res.body.data.slug;

      // Try get by slug
      await publicAgent.get(`/news/${draftSlug}`).expect(404);
    });
  });

  describe('Cleanup', () => {
    it('should delete a news item', async () => {
      await adminAgent
        .delete(`/admin/news/${newsId}`)
        .set('x-csrf-token', adminCsrfToken)
        .expect(204);
      
      // Verify deleted
      await adminAgent.get(`/admin/news/${newsId}`).expect(404);
    });
  });
});
