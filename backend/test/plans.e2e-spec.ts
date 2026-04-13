import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  login,
  prisma,
  resetDatabase,
  seedBaseData,
} from './utils';

describe('Plans (e2e)', () => {
  let app: INestApplication;
  let token = '';

  beforeAll(async () => {
    process.env.POSE_PROVIDER = 'mock';
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
    await seedBaseData();
    token = await login(app, 'user1', 'User12345!');
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('should generate 4-week plan and downgrade intensity on pain spike', async () => {
    const start = await request(app.getHttpServer())
      .post('/api/assessments/start')
      .set('Authorization', `Bearer ${token}`)
      .send();

    const sessionId = start.body.id as number;
    const options = await prisma.questionOption.findMany({
      orderBy: { id: 'asc' },
    });

    await request(app.getHttpServer())
      .post(`/api/assessments/${sessionId}/answers`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [
          { questionId: options[1].questionId, optionId: options[1].id },
        ],
      });

    await request(app.getHttpServer())
      .post(`/api/assessments/${sessionId}/analyze`)
      .set('Authorization', `Bearer ${token}`)
      .send({ injectedMetrics: { pelvicTilt: 14 } });

    const gen = await request(app.getHttpServer())
      .post(`/api/plans/generate/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(gen.body.weeks).toBe(4);
    const item = gen.body.items[0];

    const log = await request(app.getHttpServer())
      .post(`/api/plans/${gen.body.id}/items/${item.id}/log`)
      .set('Authorization', `Bearer ${token}`)
      .send({ done: true, painLevel: 8, feedback: 'pain increased' });

    expect(log.body.adjustment).toBe('regress');
  });
});
