import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from './../src/infrastructure/prisma/prisma.service';
import { setupE2EApp, teardownE2EApp } from './e2e-setup';
import * as argon2 from 'argon2';

describe('TicketsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;
  let adminToken: string;
  let csrfToken: string;
  let ticketId: string;

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;
    prisma = setup.prisma;

    // Cleanup
    await prisma.user.deleteMany({ where: { email: { startsWith: 'e2e_ticket' } } });
    await prisma.ticket.deleteMany({ where: { subject: { startsWith: 'E2E Ticket' } } });

    const passwordHash = await argon2.hash('password123');
    
    // Create regular user
    await prisma.user.create({
      data: {
        email: 'e2e_ticket_user@example.com',
        name: 'E2E Ticket User',
        password: passwordHash,
        email_verified_at: new Date(),
        is_active: true,
      }
    });

    // Create admin user
    await prisma.user.create({
      data: {
        email: 'e2e_ticket_admin@example.com',
        name: 'E2E Ticket Admin',
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

    // Login as user
    const userLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Cookie', [`csrf_token=${csrfToken}`])
      .set('x-csrf-token', csrfToken)
      .send({ email: 'e2e_ticket_user@example.com', password: 'password123' })
      .expect(200);
    const userCookies = userLoginRes.headers['set-cookie'] || [];
    const userAccessCookie = userCookies.find((c: string) => c.startsWith('access_token='));
    userToken = userAccessCookie.split(';')[0].split('=')[1];

    // Login as admin
    const adminLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Cookie', [`csrf_token=${csrfToken}`])
      .set('x-csrf-token', csrfToken)
      .send({ email: 'e2e_ticket_admin@example.com', password: 'password123' })
      .expect(200);
    const adminCookies = adminLoginRes.headers['set-cookie'] || [];
    const adminAccessCookie = adminCookies.find((c: string) => c.startsWith('access_token='));
    adminToken = adminAccessCookie.split(';')[0].split('=')[1];
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({ where: { email: { startsWith: 'e2e_ticket' } } });
      await prisma.ticket.deleteMany({ where: { subject: { startsWith: 'E2E Ticket' } } });
    }
    await teardownE2EApp(app);
  });

  describe('User Flow', () => {
    it('should create a ticket', async () => {
      const res = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Cookie', [`csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({
          subject: 'E2E Ticket Subject',
          description: 'This is a description for E2E ticket that is longer than 10 characters',
          priority: 'HIGH'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.subject).toBe('E2E Ticket Subject');
      ticketId = res.body.data.id;
    });

    it('should list tickets for user', async () => {
      const res = await request(app.getHttpServer())
        .get('/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });
  });

  describe('Admin Flow', () => {
    it('should list all tickets as admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/tickets')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('should update a ticket status as admin', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/admin/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({
          status: 'RESOLVED'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('RESOLVED');
    });
  });
});
