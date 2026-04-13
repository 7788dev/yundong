import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const defaultQuestions = [
  {
    code: 'Q_NECK_001',
    category: 'neck_shoulder',
    questionText: 'Do you keep your head down for more than 4 hours per day?',
    weight: 1.2,
    options: [
      { optionText: 'Rarely', score: 10, sort: 1 },
      { optionText: 'Sometimes', score: 35, sort: 2 },
      { optionText: 'Often', score: 70, sort: 3 },
      { optionText: 'Almost always', score: 90, sort: 4 },
    ],
  },
  {
    code: 'Q_THORACIC_001',
    category: 'thoracic',
    questionText: 'Do you tend to have rounded shoulders while standing?',
    weight: 1.1,
    options: [
      { optionText: 'No', score: 10, sort: 1 },
      { optionText: 'Mild', score: 40, sort: 2 },
      { optionText: 'Obvious', score: 75, sort: 3 },
    ],
  },
  {
    code: 'Q_PELVIS_001',
    category: 'pelvis',
    questionText: 'Do you feel lower back tightness after prolonged sitting?',
    weight: 1.3,
    options: [
      { optionText: 'Rarely', score: 10, sort: 1 },
      { optionText: 'Sometimes', score: 40, sort: 2 },
      { optionText: 'Often', score: 75, sort: 3 },
      { optionText: 'Always', score: 90, sort: 4 },
    ],
  },
  {
    code: 'Q_LOWER_001',
    category: 'lower_limb',
    questionText: 'Do your knees collapse inward during squat?',
    weight: 1.2,
    options: [
      { optionText: 'No', score: 10, sort: 1 },
      { optionText: 'Sometimes', score: 35, sort: 2 },
      { optionText: 'Clearly', score: 70, sort: 3 },
    ],
  },
];

const defaultActions = [
  {
    code: 'A_NECK_CHIN_TUCK',
    name: 'Chin tuck',
    targetProblem: 'head_forward',
    level: 'beginner',
    contraindications: 'Avoid in acute neck pain.',
    steps: 'Stand against wall and gently retract chin for 5 seconds.',
    durationSec: 30,
    sets: 3,
  },
  {
    code: 'A_SHOULDER_WALL_SLIDE',
    name: 'Wall slide',
    targetProblem: 'rounded_shoulder',
    level: 'beginner',
    contraindications: 'Avoid in acute shoulder impingement.',
    steps: 'Keep back on wall and slide arms up and down in control.',
    durationSec: 40,
    sets: 3,
  },
  {
    code: 'A_PELVIS_BRIDGE',
    name: 'Bridge',
    targetProblem: 'anterior_pelvic_tilt',
    level: 'beginner',
    contraindications: 'Avoid in acute low back injury.',
    steps: 'Supine bridge with core brace, hold at top for 2 seconds.',
    durationSec: 45,
    sets: 3,
  },
  {
    code: 'A_KNEE_BAND_SQUAT',
    name: 'Band squat',
    targetProblem: 'knee_valgus',
    level: 'intermediate',
    contraindications: 'Avoid in acute knee pain.',
    steps: 'Use mini band above knees and squat with knee alignment.',
    durationSec: 45,
    sets: 3,
  },
];

const defaultRules = [
  {
    ruleName: 'Head forward rule',
    problemType: 'head_forward',
    conditionJson: {
      any: [
        { domain: 'neck_shoulder', gte: 60 },
        { metric: 'headForwardAngle', gte: 15 },
      ],
    },
    scoreFormula: 'Q*0.65+P*0.35',
    planTemplateJson: { focus: ['release', 'activate'] },
    priority: 90,
  },
  {
    ruleName: 'Rounded shoulder rule',
    problemType: 'rounded_shoulder',
    conditionJson: {
      any: [
        { domain: 'thoracic', gte: 60 },
        { metric: 'shoulderAsymmetry', gte: 8 },
      ],
    },
    scoreFormula: 'Q*0.65+P*0.35',
    planTemplateJson: { focus: ['stretch', 'strengthen'] },
    priority: 80,
  },
  {
    ruleName: 'Anterior pelvic tilt rule',
    problemType: 'anterior_pelvic_tilt',
    conditionJson: {
      any: [
        { domain: 'pelvis', gte: 60 },
        { metric: 'pelvicTilt', gte: 12 },
      ],
    },
    scoreFormula: 'Q*0.65+P*0.35',
    planTemplateJson: { focus: ['release', 'activate', 'strengthen'] },
    priority: 95,
  },
  {
    ruleName: 'Knee valgus rule',
    problemType: 'knee_valgus',
    conditionJson: {
      any: [
        { domain: 'lower_limb', gte: 60 },
        { metric: 'qAngle', gte: 18 },
      ],
    },
    scoreFormula: 'Q*0.65+P*0.35',
    planTemplateJson: { focus: ['activate', 'strengthen'] },
    priority: 85,
  },
];


async function ensureSchema() {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "User" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "username" TEXT NOT NULL UNIQUE, "passwordHash" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'user', "gender" TEXT, "age" INTEGER, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "QuestionBank" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "code" TEXT NOT NULL UNIQUE, "category" TEXT NOT NULL, "questionText" TEXT NOT NULL, "answerType" TEXT NOT NULL DEFAULT 'single', "weight" REAL NOT NULL DEFAULT 1, "enabled" BOOLEAN NOT NULL DEFAULT 1, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "QuestionOption" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "questionId" INTEGER NOT NULL, "optionText" TEXT NOT NULL, "score" REAL NOT NULL, "sort" INTEGER NOT NULL DEFAULT 0)`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "ActionLibrary" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "code" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "targetProblem" TEXT NOT NULL, "level" TEXT NOT NULL DEFAULT 'beginner', "contraindications" TEXT, "steps" TEXT NOT NULL, "durationSec" INTEGER NOT NULL DEFAULT 30, "sets" INTEGER NOT NULL DEFAULT 2, "enabled" BOOLEAN NOT NULL DEFAULT 1, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "RuleEngineRule" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "ruleName" TEXT NOT NULL, "problemType" TEXT NOT NULL, "conditionJson" TEXT NOT NULL, "scoreFormula" TEXT, "planTemplateJson" TEXT, "priority" INTEGER NOT NULL DEFAULT 0, "enabled" BOOLEAN NOT NULL DEFAULT 1, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "SystemSetting" ("key" TEXT NOT NULL PRIMARY KEY, "value" TEXT NOT NULL, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
}

async function main() {
  await ensureSchema();
  const adminHash = await bcrypt.hash('Admin123!', 10);
  const userHash = await bcrypt.hash('User12345!', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: adminHash, role: 'admin' },
    create: { username: 'admin', passwordHash: adminHash, role: 'admin', gender: 'unknown' },
  });

  await prisma.user.upsert({
    where: { username: 'demo' },
    update: { passwordHash: userHash, role: 'user' },
    create: { username: 'demo', passwordHash: userHash, role: 'user', gender: 'unknown' },
  });

  for (const q of defaultQuestions) {
    const question = await prisma.questionBank.upsert({
      where: { code: q.code },
      update: {
        category: q.category,
        questionText: q.questionText,
        weight: q.weight,
        enabled: true,
      },
      create: {
        code: q.code,
        category: q.category,
        questionText: q.questionText,
        answerType: 'single',
        weight: q.weight,
        enabled: true,
      },
    });

    await prisma.questionOption.deleteMany({ where: { questionId: question.id } });
    await prisma.questionOption.createMany({
      data: q.options.map(option => ({
        questionId: question.id,
        optionText: option.optionText,
        score: option.score,
        sort: option.sort,
      })),
    });
  }

  for (const action of defaultActions) {
    await prisma.actionLibrary.upsert({
      where: { code: action.code },
      update: action,
      create: action,
    });
  }

  await prisma.ruleEngineRule.deleteMany({});
  await prisma.ruleEngineRule.createMany({
    data: defaultRules.map(rule => ({
      ruleName: rule.ruleName,
      problemType: rule.problemType,
      conditionJson: JSON.stringify(rule.conditionJson),
      scoreFormula: rule.scoreFormula,
      planTemplateJson: JSON.stringify(rule.planTemplateJson),
      priority: rule.priority,
      enabled: true,
    })),
  });

  await prisma.systemSetting.upsert({
    where: { key: 'pose_model' },
    update: {
      value: JSON.stringify({ provider: 'disabled', threshold: 0.5, fallback: true }),
    },
    create: {
      key: 'pose_model',
      value: JSON.stringify({ provider: 'disabled', threshold: 0.5, fallback: true }),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });