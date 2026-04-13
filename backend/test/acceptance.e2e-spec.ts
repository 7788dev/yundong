import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  login,
  prisma,
  resetDatabase,
  seedBaseData,
} from './utils';

describe('Acceptance flow (e2e)', () => {
  let app: INestApplication;
  let token = '';

  beforeAll(async () => {
    process.env.POSE_PROVIDER = 'disabled';
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

  it('full flow should pass with provider disabled', async () => {
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
          { questionId: options[0].questionId, optionId: options[0].id },
        ],
      });

    const analyzed = await request(app.getHttpServer())
      .post(`/api/assessments/${sessionId}/analyze`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(analyzed.body.pose.fallbackUsed).toBe(true);

    const generated = await request(app.getHttpServer())
      .post(`/api/plans/generate/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(generated.body.weeks).toBe(4);
  });
});
