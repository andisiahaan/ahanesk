import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupE2EApp } from './e2e-setup';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import * as argon2 from 'argon2';

describe('HelpController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminAgent: request.SuperAgentTest;
  let userAgent: request.SuperAgentTest;
  let publicAgent: request.SuperAgentTest;
  
  let adminCsrfToken: string;
  let userCsrfToken: string;
  
  let categoryId: string;
  const categorySlug = 'e2e-help-cat';
  
  let articleId: string;
  const articleSlug = 'e2e-help-article';

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;
    prisma = setup.prisma;

    // Cleanup and create test users
    await prisma.user.deleteMany({ where: { email: { in: ['e2e_help_admin@example.com', 'e2e_help_user@example.com'] } } });
    await prisma.helpCategory.deleteMany({ where: { slug: categorySlug } });
    
    const passwordHash = await argon2.hash('password123');
    await prisma.user.create({
      data: { email: 'e2e_help_admin@example.com', name: 'Admin', password: passwordHash, role: 'ADMIN', email_verified_at: new Date(), is_active: true }
    });
    await prisma.user.create({
      data: { email: 'e2e_help_user@example.com', name: 'User', password: passwordHash, role: 'USER', email_verified_at: new Date(), is_active: true }
    });

    adminAgent = request.agent(app.getHttpServer());
    userAgent = request.agent(app.getHttpServer());
    publicAgent = request.agent(app.getHttpServer());

    // Login Admin
    let res = await adminAgent.get('/');
    let cookies = res.headers['set-cookie'] || [];
    adminCsrfToken = cookies.find((c: string) => c.startsWith('csrf_token='))?.split(';')[0].split('=')[1];

    await adminAgent
      .post('/auth/login')
      .set('x-csrf-token', adminCsrfToken)
      .send({ email: 'e2e_help_admin@example.com', password: 'password123' })
      .expect(200);

    // Login User
    res = await userAgent.get('/');
    cookies = res.headers['set-cookie'] || [];
    userCsrfToken = cookies.find((c: string) => c.startsWith('csrf_token='))?.split(';')[0].split('=')[1];

    await userAgent
      .post('/auth/login')
      .set('x-csrf-token', userCsrfToken)
      .send({ email: 'e2e_help_user@example.com', password: 'password123' })
      .expect(200);

  }, 30000);

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Admin Categories Flow', () => {
    it('should create a help category', async () => {
      const res = await adminAgent
        .post('/admin/help/categories')
        .set('x-csrf-token', adminCsrfToken)
        .send({
          title: 'E2E Category',
          slug: categorySlug,
          is_published: true,
          sort_order: 1
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe(categorySlug);
      categoryId = res.body.data.id;
    });

    it('should list all categories as admin', async () => {
      const res = await adminAgent.get('/admin/help/categories').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.some((c: any) => c.id === categoryId)).toBe(true);
    });

    it('should update a category', async () => {
      const res = await adminAgent
        .patch(`/admin/help/categories/${categoryId}`)
        .set('x-csrf-token', adminCsrfToken)
        .send({ title: 'E2E Category Updated' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('E2E Category Updated');
    });
  });

  describe('Admin Articles Flow', () => {
    it('should create an article in the category', async () => {
      const res = await adminAgent
        .post('/admin/help/articles')
        .set('x-csrf-token', adminCsrfToken)
        .send({
          category_id: categoryId,
          title: 'E2E Article',
          slug: articleSlug,
          content: 'E2E Article Content',
          is_published: true,
          sort_order: 1
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe(articleSlug);
      articleId = res.body.data.id;
    });

    it('should list all articles as admin', async () => {
      const res = await adminAgent.get('/admin/help/articles').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.some((a: any) => a.id === articleId)).toBe(true);
      expect(res.body.data.meta).toBeDefined();
    });

    it('should get an article by id as admin', async () => {
      const res = await adminAgent.get(`/admin/help/articles/${articleId}`).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(articleId);
    });
  });

  describe('Public Help Flow', () => {
    it('should list published categories publicly', async () => {
      const res = await publicAgent.get('/help/categories').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.some((c: any) => c.id === categoryId)).toBe(true);
    });

    it('should get a published article by slug publicly', async () => {
      const res = await publicAgent.get(`/help/articles/${articleSlug}`).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe(articleSlug);
    });

    it('should search for an article', async () => {
      const res = await publicAgent.get('/help/articles/search?q=E2E%20Article').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.some((a: any) => a.id === articleId)).toBe(true);
    });
  });

  describe('User Vote Flow', () => {
    it('should allow user to vote helpful', async () => {
      const res = await userAgent
        .post(`/help/articles/${articleId}/vote`)
        .set('x-csrf-token', userCsrfToken)
        .send({ helpful: true })
        .expect(201);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.helpful_yes).toBe(1);
    });
  });

  describe('Cleanup', () => {
    it('should delete the article', async () => {
      await adminAgent
        .delete(`/admin/help/articles/${articleId}`)
        .set('x-csrf-token', adminCsrfToken)
        .expect(204);
      
      await adminAgent.get(`/admin/help/articles/${articleId}`).expect(404);
    });

    it('should delete the category', async () => {
      await adminAgent
        .delete(`/admin/help/categories/${categoryId}`)
        .set('x-csrf-token', adminCsrfToken)
        .expect(204);
    });
  });
});
