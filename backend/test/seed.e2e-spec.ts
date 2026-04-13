import { prisma, resetDatabase, seedBaseData } from './utils';

describe('Seed data', () => {
  beforeAll(async () => {
    await resetDatabase();
    await seedBaseData();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should seed default questions/actions/rules', async () => {
    const qCount = await prisma.questionBank.count();
    const aCount = await prisma.actionLibrary.count();
    const rCount = await prisma.ruleEngineRule.count();
    expect(qCount).toBeGreaterThan(0);
    expect(aCount).toBeGreaterThan(0);
    expect(rCount).toBeGreaterThan(0);
  });
});
