import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupE2EApp } from './e2e-setup';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import * as argon2 from 'argon2';

describe('NotificationController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminAgent: request.SuperAgentTest;
  let userAgent: request.SuperAgentTest;
  
  let adminCsrfToken: string;
  let userCsrfToken: string;
  
  let userId: string;

  beforeAll(async () => {
    const setup = await setupE2EApp();
    app = setup.app;
    prisma = setup.prisma;

    // Cleanup and create test users
    await prisma.user.deleteMany({ where: { email: { in: ['e2e_notif_admin@example.com', 'e2e_notif_user@example.com'] } } });
    
    const passwordHash = await argon2.hash('password123');
    await prisma.user.create({
      data: { email: 'e2e_notif_admin@example.com', name: 'Admin', password: passwordHash, role: 'ADMIN', email_verified_at: new Date(), is_active: true }
    });
    const user = await prisma.user.create({
      data: { email: 'e2e_notif_user@example.com', name: 'User', password: passwordHash, role: 'USER', email_verified_at: new Date(), is_active: true }
    });
    userId = user.id;

    adminAgent = request.agent(app.getHttpServer());
    userAgent = request.agent(app.getHttpServer());

    // Login Admin
    let res = await adminAgent.get('/');
    let cookies = res.headers['set-cookie'] || [];
    adminCsrfToken = cookies.find((c: string) => c.startsWith('csrf_token='))?.split(';')[0].split('=')[1];

    await adminAgent
      .post('/auth/login')
      .set('x-csrf-token', adminCsrfToken)
      .send({ email: 'e2e_notif_admin@example.com', password: 'password123' })
      .expect(200);

    // Login User
    res = await userAgent.get('/');
    cookies = res.headers['set-cookie'] || [];
    userCsrfToken = cookies.find((c: string) => c.startsWith('csrf_token='))?.split(';')[0].split('=')[1];

    await userAgent
      .post('/auth/login')
      .set('x-csrf-token', userCsrfToken)
      .send({ email: 'e2e_notif_user@example.com', password: 'password123' })
      .expect(200);

  }, 30000);

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Admin Notification Flow', () => {
    it('should allow admin to broadcast notification', async () => {
      const res = await adminAgent
        .post('/admin/notifications/broadcast')
        .set('x-csrf-token', adminCsrfToken)
        .send({
          type: 'system.announcement',
          title: 'E2E Broadcast',
          message: 'This is a test broadcast',
          userIds: [userId]
        })
        .expect(200);

      expect(res.body.data.message).toBe('Broadcast queued');
    });

    it('should list all notifications as admin', async () => {
      const res = await adminAgent.get('/admin/notifications').expect(200);
      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.meta).toBeDefined();
    });
  });

  describe('User Notification Flow', () => {
    it('should list user notifications', async () => {
      // Wait for broadcast to be processed by background queues if needed
      // but in test environment queues might not run instantly.
      // Actually broadcast in service writes to DB instantly.
      const res = await userAgent.get('/notifications').expect(200);
      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.meta).toBeDefined();
      
      const notif = res.body.data.items.find((n: any) => n.title === 'E2E Broadcast');
      expect(notif).toBeDefined();
      expect(notif.is_read).toBe(false);
    });

    it('should get unread count', async () => {
      const res = await userAgent.get('/notifications/unread-count').expect(200);
      expect(typeof res.body.data.count).toBe('number');
      expect(res.body.data.count).toBeGreaterThan(0);
    });

    it('should mark a notification as read', async () => {
      const listRes = await userAgent.get('/notifications').expect(200);
      const notif = listRes.body.data.items.find((n: any) => n.title === 'E2E Broadcast');
      
      const res = await userAgent
        .patch(`/notifications/${notif.id}/read`)
        .set('x-csrf-token', userCsrfToken)
        .expect(200);
      
      expect(res.body.data.message).toBe('Marked as read');

      const updatedList = await userAgent.get('/notifications').expect(200);
      const updatedNotif = updatedList.body.data.items.find((n: any) => n.id === notif.id);
      expect(updatedNotif.is_read).toBe(true);
    });

    it('should mark all notifications as read', async () => {
      const res = await userAgent
        .patch('/notifications/read-all')
        .set('x-csrf-token', userCsrfToken)
        .expect(200);
      
      expect(res.body.data.message).toBe('All marked as read');
      
      const unreadRes = await userAgent.get('/notifications/unread-count').expect(200);
      expect(unreadRes.body.data.count).toBe(0);
    });
  });

  describe('User Notification Preferences', () => {
    it('should get notification preferences', async () => {
      const res = await userAgent.get('/notifications/preferences').expect(200);
      expect(res.body.data.types).toBeDefined();
      expect(res.body.data.channels).toBeDefined();
    });

    it('should update notification preferences', async () => {
      const res = await userAgent
        .patch('/notifications/preferences')
        .set('x-csrf-token', userCsrfToken)
        .send({
          types: { 'ticket.replied': false },
          channels: { email: false }
        })
        .expect(200);
      
      expect(res.body.data.message).toBe('Preferences saved');
    });
  });

  describe('Push Subscriptions', () => {
    let subId: string;

    it('should subscribe to push notifications', async () => {
      const res = await userAgent
        .post('/notifications/push/subscribe')
        .set('x-csrf-token', userCsrfToken)
        .send({
          endpoint: 'https://fcm.googleapis.com/fcm/send/e2e-push',
          p256dh: 'e2e-p256dh',
          auth: 'e2e-auth',
          userAgent: 'E2E Agent'
        })
        .expect(200);
      
      expect(res.body.data.message).toBe('Subscribed');
    });

    it('should list push subscriptions', async () => {
      const res = await userAgent.get('/notifications/push/subscriptions').expect(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].endpoint).toBe('https://fcm.googleapis.com/fcm/send/e2e-push');
      subId = res.body.data[0].id;
    });

    it('should unsubscribe from push via id', async () => {
      const res = await userAgent
        .delete(`/notifications/push/subscriptions/${subId}`)
        .set('x-csrf-token', userCsrfToken)
        .expect(200);
      
      expect(res.body.data.message).toBe('Unsubscribed');
      
      const listRes = await userAgent.get('/notifications/push/subscriptions').expect(200);
      expect(listRes.body.data.some((s: any) => s.id === subId)).toBe(false);
    });

    it('should unsubscribe from push via endpoint', async () => {
      // Subscribe again
      await userAgent
        .post('/notifications/push/subscribe')
        .set('x-csrf-token', userCsrfToken)
        .send({
          endpoint: 'https://fcm.googleapis.com/fcm/send/e2e-push-2',
          p256dh: 'e2e-p256dh',
          auth: 'e2e-auth'
        })
        .expect(200);
      
      const res = await userAgent
        .delete('/notifications/push/unsubscribe')
        .set('x-csrf-token', userCsrfToken)
        .send({ endpoint: 'https://fcm.googleapis.com/fcm/send/e2e-push-2' })
        .expect(200);

      expect(res.body.data.message).toBe('Unsubscribed');
    });
  });
});
