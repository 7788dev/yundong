import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  login,
  prisma,
  resetDatabase,
  seedBaseData,
} from './utils';

async function createAnalyzedSession(
  app: INestApplication,
  token: string,
  scoreOptionIndex: number,
) {
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
        {
          questionId: options[scoreOptionIndex].questionId,
          optionId: options[scoreOptionIndex].id,
        },
      ],
    });

  await request(app.getHttpServer())
    .post(`/api/assessments/${sessionId}/analyze`)
    .set('Authorization', `Bearer ${token}`)
    .send({});

  return sessionId;
}

describe('Reassessment (e2e)', () => {
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

  it('should compare baseline and current sessions', async () => {
    const baselineSessionId = await createAnalyzedSession(app, token, 0);
    const currentSessionId = await createAnalyzedSession(app, token, 1);

    const res = await request(app.getHttpServer())
      .post('/api/assessments/reassessments/compare')
      .set('Authorization', `Bearer ${token}`)
      .send({ baselineSessionId, currentSessionId });

    expect(res.body.improvement.totalDelta).toBeDefined();
    expect(res.body.improvement.recommendation).toMatch(/维持|进阶|退阶/);
  });
});
