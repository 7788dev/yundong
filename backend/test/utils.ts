import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';

export async function createTestApp() {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api');
  await app.init();
  return app;
}

export const prisma = new PrismaClient();

export async function resetDatabase() {
  await prisma.progressLog.deleteMany();
  await prisma.rehabPlanItem.deleteMany();
  await prisma.rehabPlan.deleteMany();
  await prisma.reassessment.deleteMany();
  await prisma.diagnosisResult.deleteMany();
  await prisma.poseAnalysisResult.deleteMany();
  await prisma.posePhoto.deleteMany();
  await prisma.assessmentAnswer.deleteMany();
  await prisma.assessmentSession.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.questionBank.deleteMany();
  await prisma.actionLibrary.deleteMany();
  await prisma.ruleEngineRule.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedBaseData() {
  const adminHash = await bcrypt.hash('Admin123!', 10);
  const userHash = await bcrypt.hash('User12345!', 10);

  await prisma.user.createMany({
    data: [
      { username: 'admin', passwordHash: adminHash, role: 'admin' },
      { username: 'user1', passwordHash: userHash, role: 'user' },
    ],
  });

  const question = await prisma.questionBank.create({
    data: {
      code: 'Q_TEST_001',
      category: 'pelvis',
      questionText: '测试问题1',
      weight: 1,
      answerType: 'single',
      enabled: true,
    },
  });

  const question2 = await prisma.questionBank.create({
    data: {
      code: 'Q_TEST_002',
      category: 'neck_shoulder',
      questionText: '测试问题2',
      weight: 1,
      answerType: 'single',
      enabled: true,
    },
  });

  await prisma.questionOption.createMany({
    data: [
      { questionId: question.id, optionText: '轻微', score: 30, sort: 1 },
      { questionId: question.id, optionText: '严重', score: 80, sort: 2 },
      { questionId: question2.id, optionText: '轻微', score: 20, sort: 1 },
      { questionId: question2.id, optionText: '严重', score: 70, sort: 2 },
    ],
  });

  await prisma.actionLibrary.createMany({
    data: [
      {
        code: 'A_TEST_001',
        name: '臀桥',
        targetProblem: 'anterior_pelvic_tilt',
        level: 'beginner',
        steps: '测试动作',
        durationSec: 30,
        sets: 2,
        enabled: true,
      },
      {
        code: 'A_TEST_002',
        name: '下巴内收',
        targetProblem: 'head_forward',
        level: 'beginner',
        steps: '测试动作',
        durationSec: 30,
        sets: 2,
        enabled: true,
      },
    ],
  });

  await prisma.ruleEngineRule.createMany({
    data: [
      {
        ruleName: '骨盆前倾测试规则',
        problemType: 'anterior_pelvic_tilt',
        conditionJson: JSON.stringify({
          any: [
            { domain: 'pelvis', gte: 60 },
            { metric: 'pelvicTilt', gte: 12 },
          ],
        }),
        scoreFormula: 'Q*0.65+P*0.35',
        planTemplateJson: JSON.stringify({ focus: ['activate'] }),
        priority: 90,
        enabled: true,
      },
      {
        ruleName: '头前引测试规则',
        problemType: 'head_forward',
        conditionJson: JSON.stringify({
          any: [
            { domain: 'neck_shoulder', gte: 60 },
            { metric: 'headForwardAngle', gte: 15 },
          ],
        }),
        scoreFormula: 'Q*0.65+P*0.35',
        planTemplateJson: JSON.stringify({ focus: ['activate'] }),
        priority: 80,
        enabled: true,
      },
    ],
  });

  await prisma.systemSetting.create({
    data: {
      key: 'pose_model',
      value: JSON.stringify({
        provider: 'disabled',
        threshold: 0.5,
        fallback: true,
      }),
    },
  });
}

export async function login(
  app: INestApplication,
  username: string,
  password: string,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ username, password });
  return res.body.accessToken as string;
}
