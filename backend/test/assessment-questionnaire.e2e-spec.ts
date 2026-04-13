import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  login,
  prisma,
  resetDatabase,
  seedBaseData,
} from './utils';

describe('Assessment questionnaire (e2e)', () => {
  let app: INestApplication;
  let token = '';

  beforeAll(async () => {
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

  it('should compute questionnaire score', async () => {
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
          { questionId: options[2].questionId, optionId: options[2].id },
        ],
      });

    const analyze = await request(app.getHttpServer())
      .post(`/api/assessments/${sessionId}/analyze`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(analyze.status).toBe(201);
    expect(analyze.body.questionnaireScore.total).toBeGreaterThan(0);
  });
});
