import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  login,
  prisma,
  resetDatabase,
  seedBaseData,
} from './utils';

describe('Admin CRUD (e2e)', () => {
  let app: INestApplication;
  let adminToken = '';
  let userToken = '';

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
    await seedBaseData();
    adminToken = await login(app, 'admin', 'Admin123!');
    userToken = await login(app, 'user1', 'User12345!');
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('admin can create question but normal user cannot', async () => {
    const adminRes = await request(app.getHttpServer())
      .post('/api/admin/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'Q_NEW_001',
        category: 'neck_shoulder',
        questionText: '示例',
        weight: 1,
      });
    expect(adminRes.status).toBe(201);

    const userRes = await request(app.getHttpServer())
      .post('/api/admin/questions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        code: 'Q_NEW_002',
        category: 'neck_shoulder',
        questionText: '示例',
        weight: 1,
      });
    expect(userRes.status).toBe(403);
  });
});
