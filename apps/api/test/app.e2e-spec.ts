import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupE2EApp, teardownE2EApp } from './e2e-setup';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const setup = await setupE2EApp();
    app = setup.app;
  });

  afterEach(async () => {
    await teardownE2EApp(app);
  });

  it('/ (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/')
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.features).toBeDefined();
  });
});
