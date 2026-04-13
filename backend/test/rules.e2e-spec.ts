import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  login,
  prisma,
  resetDatabase,
  seedBaseData,
} from './utils';

describe('Rules engine (e2e)', () => {
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

  it('should output diagnosis when rule conditions matched', async () => {
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

    const res = await request(app.getHttpServer())
      .post(`/api/assessments/${sessionId}/analyze`)
      .set('Authorization', `Bearer ${token}`)
      .send({ injectedMetrics: { pelvicTilt: 14 } });

    expect(res.body.diagnosis).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          problemType: 'anterior_pelvic_tilt',
          severity: expect.stringMatching(/mild|moderate|severe/),
        }),
      ]),
    );
  });
});
