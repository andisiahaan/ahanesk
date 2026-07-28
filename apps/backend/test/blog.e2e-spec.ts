import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from './../src/infrastructure/prisma/prisma.service';
import { setupE2EApp, teardownE2EApp } from './e2e-setup';
import * as argon2 from 'argon2';

describe('BlogController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let csrfToken: string;

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;
    prisma = setup.prisma;

    // Cleanup
    await prisma.user.deleteMany({ where: { email: { startsWith: 'e2e_blog' } } });
    await prisma.blogCategory.deleteMany({ where: { slug: { startsWith: 'e2e-cat' } } });

    // Setup Admin
    const passwordHash = await argon2.hash('admin123');
    await prisma.user.create({
      data: {
        email: 'e2e_blog_admin@example.com',
        name: 'E2E Blog Admin',
        password: passwordHash,
        role: 'ADMIN',
        email_verified_at: new Date(),
        is_active: true,
      }
    });

    const res = await request(app.getHttpServer()).get('/');
    const cookies = res.headers['set-cookie'] || [];
    const csrfCookie = cookies.find((c: string) => c.startsWith('csrf_token='));
    csrfToken = csrfCookie.split(';')[0].split('=')[1];

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Cookie', [`csrf_token=${csrfToken}`])
      .set('x-csrf-token', csrfToken)
      .send({ email: 'e2e_blog_admin@example.com', password: 'admin123' })
      .expect(200);

    const loginCookies = loginRes.headers['set-cookie'] || [];
    const accessCookie = loginCookies.find((c: string) => c.startsWith('access_token='));
    adminToken = accessCookie.split(';')[0].split('=')[1];
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({ where: { email: { startsWith: 'e2e_blog' } } });
      await prisma.blogCategory.deleteMany({ where: { slug: { startsWith: 'e2e-cat' } } });
    }
    await teardownE2EApp(app);
  });

  describe('/admin/blog/categories (POST, GET)', () => {
    it('should create a category as admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/blog/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({
          name: 'E2E Category',
          slug: 'e2e-category-test',
          is_active: true,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('e2e-category-test');
    });

    it('should fetch categories as admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/blog/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('/blog/categories (GET)', () => {
    it('should return active categories publicly', async () => {
      const res = await request(app.getHttpServer())
        .get('/blog/categories')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
