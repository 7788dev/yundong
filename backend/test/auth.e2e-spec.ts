import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, prisma, resetDatabase } from './utils';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('register and login should return jwt', async () => {
    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        username: 'u01',
        password: 'Passw0rd!',
        role: 'user',
      });
    expect(registerRes.status).toBe(201);

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'u01',
        password: 'Passw0rd!',
      });
    expect(loginRes.status).toBe(201);
    expect(loginRes.body.accessToken).toBeDefined();
  });
});
