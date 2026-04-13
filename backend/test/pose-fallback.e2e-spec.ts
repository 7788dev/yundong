import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  login,
  prisma,
  resetDatabase,
  seedBaseData,
} from './utils';

describe('Pose fallback (e2e)', () => {
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

  it('should fallback to questionnaire-only when pose provider unavailable', async () => {
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

    const analyze = await request(app.getHttpServer())
      .post(`/api/assessments/${sessionId}/analyze`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(analyze.body.pose.fallbackUsed).toBe(true);
    expect(analyze.body.finalScore.total).toBe(
      analyze.body.questionnaireScore.total,
    );
  });
});
