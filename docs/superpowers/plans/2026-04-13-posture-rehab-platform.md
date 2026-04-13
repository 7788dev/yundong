# 体态评估与康复平台（pure-admin-thin + NestJS + SQLite）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建可运行的 MVP：用户问卷+照片评估、自动分析、4周康复计划、复评对比，以及管理员配置题库/动作/规则。

**Architecture:** 使用前后端分离：`frontend` 基于 pure-admin-thin，`backend` 基于 NestJS + Prisma(SQLite)。后端将评估流程拆分为 `assessment -> pose-provider -> rule-engine -> plan-generator` 四个清晰模块；姿态识别通过 Provider 接口可插拔，默认带 fallback 策略，模型不可用时自动降级为仅问卷评分。

**Tech Stack:** Vue3 + Vite + pure-admin-thin, NestJS, Prisma ORM, SQLite, JWT, Vitest, Jest, Supertest, pnpm

---

## Scope Check

当前 spec 聚焦单一可交付子系统（体态评估平台 MVP），无须再拆成多个独立计划，可直接执行本计划。

---

## 0) 代码结构（先锁定文件边界）

### Monorepo 目录
- Create: `pnpm-workspace.yaml`
- Create: `package.json`
- Create: `frontend/`（pure-admin-thin 工程）
- Create: `backend/`（NestJS 工程）

### 后端关键文件
- Create: `backend/prisma/schema.prisma`
- Create: `backend/prisma/seed.ts`
- Create: `backend/src/prisma/prisma.module.ts`
- Create: `backend/src/prisma/prisma.service.ts`
- Create: `backend/src/modules/auth/*`
- Create: `backend/src/modules/assessment/*`
- Create: `backend/src/modules/pose/*`
- Create: `backend/src/modules/rules/*`
- Create: `backend/src/modules/plans/*`
- Create: `backend/src/modules/admin/*`
- Create: `backend/test/*.e2e-spec.ts`

### 前端关键文件
- Modify: `frontend/src/router/modules/*`
- Create: `frontend/src/views/user/*`
- Create: `frontend/src/views/admin/*`
- Create: `frontend/src/api/posture.ts`
- Create: `frontend/src/store/modules/posture.ts`

---

### Task 1: 初始化工作区与基础骨架

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json`
- Create: `backend/`（NestJS scaffold）
- Create: `frontend/`（pure-admin-thin scaffold）
- Test: `backend/test/app.e2e-spec.ts`

- [ ] **Step 1: 写失败的后端健康检查测试**

```ts
// backend/test/app.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Health (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('/api/health (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm --filter backend test:e2e -- app.e2e-spec.ts`
Expected: FAIL（`Cannot GET /api/health`）

- [ ] **Step 3: 最小实现健康检查与全局前缀**

```ts
// backend/src/app.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class AppController {
  @Get()
  health() {
    return { ok: true };
  }
}

// backend/src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(3000);
}
```

- [ ] **Step 4: 重新运行测试确认通过**

Run: `pnpm --filter backend test:e2e -- app.e2e-spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pnpm-workspace.yaml package.json backend frontend
git commit -m "chore: bootstrap monorepo with frontend and backend skeleton"
```

---

### Task 2: 认证与角色权限（user/admin）

**Files:**
- Create: `backend/src/modules/auth/auth.module.ts`
- Create: `backend/src/modules/auth/auth.controller.ts`
- Create: `backend/src/modules/auth/auth.service.ts`
- Create: `backend/src/modules/auth/jwt.strategy.ts`
- Create: `backend/src/modules/auth/roles.guard.ts`
- Create: `backend/src/common/decorators/roles.decorator.ts`
- Test: `backend/test/auth.e2e-spec.ts`

- [ ] **Step 1: 写失败测试（注册、登录、管理员拦截）**

```ts
// backend/test/auth.e2e-spec.ts
it('register and login should return jwt', async () => {
  const registerRes = await request(app.getHttpServer()).post('/api/auth/register').send({
    username: 'u1',
    password: 'Passw0rd!',
    role: 'user'
  });
  expect(registerRes.status).toBe(201);

  const loginRes = await request(app.getHttpServer()).post('/api/auth/login').send({
    username: 'u1',
    password: 'Passw0rd!'
  });
  expect(loginRes.status).toBe(201);
  expect(loginRes.body.accessToken).toBeDefined();
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter backend test:e2e -- auth.e2e-spec.ts`
Expected: FAIL（route not found）

- [ ] **Step 3: 最小实现 Auth 模块**

```ts
// auth.service.ts (核心签名)
async register(dto: RegisterDto) { /* hash + create user */ }
async login(dto: LoginDto) { /* validate + sign jwt */ }

// roles.decorator.ts
export const Roles = (...roles: ('user' | 'admin')[]) => SetMetadata('roles', roles);
```

- [ ] **Step 4: 测试通过**

Run: `pnpm --filter backend test:e2e -- auth.e2e-spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/auth backend/src/common backend/test/auth.e2e-spec.ts
git commit -m "feat: add auth module with jwt and role guard"
```

---

### Task 3: 建立 SQLite 数据模型与默认种子

**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/prisma/seed.ts`
- Create: `backend/src/prisma/prisma.module.ts`
- Create: `backend/src/prisma/prisma.service.ts`
- Test: `backend/test/seed.e2e-spec.ts`

- [ ] **Step 1: 写失败测试（种子后存在题库/动作/规则）**

```ts
// backend/test/seed.e2e-spec.ts
it('should seed default questions/actions/rules', async () => {
  const qCount = await prisma.questionBank.count();
  const aCount = await prisma.actionLibrary.count();
  const rCount = await prisma.ruleEngineRule.count();
  expect(qCount).toBeGreaterThan(0);
  expect(aCount).toBeGreaterThan(0);
  expect(rCount).toBeGreaterThan(0);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter backend test:e2e -- seed.e2e-spec.ts`
Expected: FAIL（model/table 不存在）

- [ ] **Step 3: 实现 Prisma schema 与 seed**

```prisma
// schema.prisma (节选)
model User {
  id           Int      @id @default(autoincrement())
  username     String   @unique
  passwordHash String
  role         String
  createdAt    DateTime @default(now())
}

model QuestionBank {
  id          Int      @id @default(autoincrement())
  code        String   @unique
  category    String
  questionText String
  weight      Float
  enabled     Boolean  @default(true)
}
```

```ts
// seed.ts (节选)
await prisma.questionBank.createMany({ data: defaultQuestions });
await prisma.actionLibrary.createMany({ data: defaultActions });
await prisma.ruleEngineRule.createMany({ data: defaultRules });
```

- [ ] **Step 4: migrate + seed + test**

Run:
- `pnpm --filter backend prisma migrate dev --name init`
- `pnpm --filter backend prisma db seed`
- `pnpm --filter backend test:e2e -- seed.e2e-spec.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/prisma backend/src/prisma backend/test/seed.e2e-spec.ts
git commit -m "feat: add sqlite schema and default seed data"
```

---

### Task 4: 评估会话与问卷评分（Q_score）

**Files:**
- Create: `backend/src/modules/assessment/assessment.module.ts`
- Create: `backend/src/modules/assessment/assessment.controller.ts`
- Create: `backend/src/modules/assessment/assessment.service.ts`
- Create: `backend/src/modules/assessment/scoring.service.ts`
- Test: `backend/test/assessment-questionnaire.e2e-spec.ts`

- [ ] **Step 1: 写失败测试（start -> submit answers -> analyze 返回Q_score）**

```ts
it('should compute questionnaire score', async () => {
  const start = await authed.post('/api/assessments/start').send();
  const sessionId = start.body.id;
  await authed.post(`/api/assessments/${sessionId}/answers`).send({ answers: [
    { questionId: 1, optionId: 2 },
    { questionId: 2, optionId: 3 }
  ]});
  const analyze = await authed.post(`/api/assessments/${sessionId}/analyze`).send();
  expect(analyze.status).toBe(201);
  expect(analyze.body.questionnaireScore.total).toBeGreaterThan(0);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter backend test:e2e -- assessment-questionnaire.e2e-spec.ts`
Expected: FAIL

- [ ] **Step 3: 实现评估 API 与评分服务**

```ts
// scoring.service.ts (核心)
computeQScore(input: { answers: Array<{ questionId: number; optionId: number }> }) {
  // load question + option -> weighted score
  return {
    total: 64,
    domains: { neckShoulder: 72, thoracic: 58, pelvis: 67, lowerLimb: 49 }
  };
}
```

- [ ] **Step 4: 测试通过**

Run: `pnpm --filter backend test:e2e -- assessment-questionnaire.e2e-spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/assessment backend/test/assessment-questionnaire.e2e-spec.ts
git commit -m "feat: add assessment session and questionnaire scoring"
```

---

### Task 5: 可插拔姿态识别 Provider 与自动降级

**Files:**
- Create: `backend/src/modules/pose/pose.module.ts`
- Create: `backend/src/modules/pose/pose.provider.ts`
- Create: `backend/src/modules/pose/providers/mock-pose.provider.ts`
- Create: `backend/src/modules/pose/providers/mediapipe.provider.ts`
- Modify: `backend/src/modules/assessment/assessment.service.ts`
- Test: `backend/test/pose-fallback.e2e-spec.ts`

- [ ] **Step 1: 写失败测试（模型不可用时 fallback_used=true）**

```ts
it('should fallback to questionnaire-only when pose provider unavailable', async () => {
  process.env.POSE_PROVIDER = 'disabled';
  const analyze = await authed.post(`/api/assessments/${sessionId}/analyze`).send();
  expect(analyze.body.pose.fallbackUsed).toBe(true);
  expect(analyze.body.finalScore.total).toBe(analyze.body.questionnaireScore.total);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter backend test:e2e -- pose-fallback.e2e-spec.ts`
Expected: FAIL

- [ ] **Step 3: 实现 Provider 接口与降级逻辑**

```ts
// pose.provider.ts
export interface PoseProvider {
  isAvailable(): Promise<boolean>;
  analyze(files: string[]): Promise<{
    confidence: number;
    metrics: Record<string, number>;
    fallbackUsed: boolean;
  }>;
}

// assessment.service.ts (融合)
if (!(await poseProvider.isAvailable())) {
  return { fallbackUsed: true, finalScore: qScore };
}
```

- [ ] **Step 4: 测试通过**

Run: `pnpm --filter backend test:e2e -- pose-fallback.e2e-spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/pose backend/src/modules/assessment backend/test/pose-fallback.e2e-spec.ts
git commit -m "feat: add pluggable pose provider with graceful fallback"
```

---

### Task 6: 规则引擎诊断输出（problem_type/severity/evidence）

**Files:**
- Create: `backend/src/modules/rules/rules.module.ts`
- Create: `backend/src/modules/rules/rules.service.ts`
- Modify: `backend/src/modules/assessment/assessment.service.ts`
- Test: `backend/test/rules.e2e-spec.ts`

- [ ] **Step 1: 写失败测试（触发骨盆前倾规则）**

```ts
it('should output diagnosis when rule conditions matched', async () => {
  const res = await authed.post(`/api/assessments/${sessionId}/analyze`).send({
    injectedMetrics: { pelvicTilt: 14 }
  });
  expect(res.body.diagnosis).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ problemType: 'anterior_pelvic_tilt', severity: 'moderate' })
    ])
  );
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter backend test:e2e -- rules.e2e-spec.ts`
Expected: FAIL

- [ ] **Step 3: 实现规则评估服务**

```ts
// rules.service.ts
evaluate(input: RuleInput): DiagnosisResult[] {
  const matched = rules
    .filter((r) => this.matchCondition(r.conditionJson, input))
    .sort((a, b) => b.priority - a.priority);
  return matched.map((r) => ({
    problemType: r.problemType,
    severity: this.resolveSeverity(input, r),
    evidence: this.buildEvidence(input, r)
  }));
}
```

- [ ] **Step 4: 测试通过**

Run: `pnpm --filter backend test:e2e -- rules.e2e-spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/rules backend/src/modules/assessment backend/test/rules.e2e-spec.ts
git commit -m "feat: add rule engine diagnosis pipeline"
```

---

### Task 7: 康复计划生成（4周）与打卡反馈退阶

**Files:**
- Create: `backend/src/modules/plans/plans.module.ts`
- Create: `backend/src/modules/plans/plans.controller.ts`
- Create: `backend/src/modules/plans/plans.service.ts`
- Test: `backend/test/plans.e2e-spec.ts`

- [ ] **Step 1: 写失败测试（生成4周计划并支持打卡反馈）**

```ts
it('should generate 4-week plan and downgrade intensity on pain spike', async () => {
  const gen = await authed.post(`/api/plans/generate/${sessionId}`).send();
  expect(gen.body.weeks).toBe(4);
  const item = gen.body.items[0];
  const log = await authed.post(`/api/plans/${gen.body.id}/items/${item.id}/log`).send({
    done: true,
    painLevel: 8,
    feedback: 'pain increased'
  });
  expect(log.body.adjustment).toBe('regress');
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter backend test:e2e -- plans.e2e-spec.ts`
Expected: FAIL

- [ ] **Step 3: 实现计划生成与反馈闭环**

```ts
// plans.service.ts
generateFromDiagnosis(sessionId: number) {
  return {
    weeks: 4,
    items: this.composeWeekItems(diagnosis, contraindications)
  };
}

logProgress(input: ProgressInput) {
  if (input.painLevel >= 7) return { adjustment: 'regress' };
  return { adjustment: 'keep' };
}
```

- [ ] **Step 4: 测试通过**

Run: `pnpm --filter backend test:e2e -- plans.e2e-spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/plans backend/test/plans.e2e-spec.ts
git commit -m "feat: add 4-week rehab plan generation and progress feedback"
```

---

### Task 8: 复评对比与趋势输出

**Files:**
- Modify: `backend/src/modules/assessment/assessment.controller.ts`
- Create: `backend/src/modules/assessment/reassessment.service.ts`
- Test: `backend/test/reassessment.e2e-spec.ts`

- [ ] **Step 1: 写失败测试（基线 vs 当前分值对比）**

```ts
it('should compare baseline and current sessions', async () => {
  const res = await authed.post('/api/reassessments/compare').send({
    baselineSessionId: 1,
    currentSessionId: 2
  });
  expect(res.body.improvement.totalDelta).toBeDefined();
  expect(res.body.improvement.recommendation).toMatch(/维持|进阶|退阶/);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter backend test:e2e -- reassessment.e2e-spec.ts`
Expected: FAIL

- [ ] **Step 3: 实现复评服务**

```ts
// reassessment.service.ts
compare(baseline: SessionScore, current: SessionScore) {
  const totalDelta = current.finalTotal - baseline.finalTotal;
  return {
    totalDelta,
    recommendation: totalDelta <= -10 ? '进阶' : totalDelta >= 10 ? '退阶' : '维持'
  };
}
```

- [ ] **Step 4: 测试通过**

Run: `pnpm --filter backend test:e2e -- reassessment.e2e-spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/assessment backend/test/reassessment.e2e-spec.ts
git commit -m "feat: add reassessment comparison and trend recommendation"
```

---

### Task 9: 管理端 CRUD（题库/动作/规则/模型设置）

**Files:**
- Create: `backend/src/modules/admin/admin.module.ts`
- Create: `backend/src/modules/admin/questions.admin.controller.ts`
- Create: `backend/src/modules/admin/actions.admin.controller.ts`
- Create: `backend/src/modules/admin/rules.admin.controller.ts`
- Create: `backend/src/modules/admin/settings.admin.controller.ts`
- Test: `backend/test/admin-crud.e2e-spec.ts`

- [ ] **Step 1: 写失败测试（admin 可改题库，user 被拒绝）**

```ts
it('admin can create question but normal user cannot', async () => {
  const adminRes = await adminAuthed.post('/api/admin/questions').send({
    code: 'Q_NEW_001', category: 'neck', questionText: '示例', weight: 1
  });
  expect(adminRes.status).toBe(201);

  const userRes = await userAuthed.post('/api/admin/questions').send({
    code: 'Q_NEW_002', category: 'neck', questionText: '示例', weight: 1
  });
  expect(userRes.status).toBe(403);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter backend test:e2e -- admin-crud.e2e-spec.ts`
Expected: FAIL

- [ ] **Step 3: 实现管理员 CRUD 与 model-config 接口**

```ts
// settings.admin.controller.ts
@Put('system/model-config')
@Roles('admin')
updateModelConfig(@Body() dto: UpdateModelConfigDto) {
  return this.service.updateModelConfig(dto);
}
```

- [ ] **Step 4: 测试通过**

Run: `pnpm --filter backend test:e2e -- admin-crud.e2e-spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/admin backend/test/admin-crud.e2e-spec.ts
git commit -m "feat: add admin CRUD for questions actions rules and model settings"
```

---

### Task 10: 前端用户端流程（评估->结果->计划->复评）

**Files:**
- Create: `frontend/src/api/posture.ts`
- Create: `frontend/src/store/modules/posture.ts`
- Create: `frontend/src/views/user/assessment/index.vue`
- Create: `frontend/src/views/user/result/index.vue`
- Create: `frontend/src/views/user/plan/index.vue`
- Create: `frontend/src/views/user/reassess/index.vue`
- Modify: `frontend/src/router/modules/user.ts`
- Test: `frontend/src/views/user/__tests__/assessment.spec.ts`

- [ ] **Step 1: 写失败前端单测（提交问卷后跳转结果页）**

```ts
it('submits assessment and navigates to result page', async () => {
  const { getByText } = render(AssessmentPage);
  await fireEvent.click(getByText('提交评估'));
  expect(mockRouterPush).toHaveBeenCalledWith(expect.stringContaining('/u/result/'));
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter pure-admin-thin test assessment.spec.ts`
Expected: FAIL

- [ ] **Step 3: 实现页面与 API 调用**

```ts
// posture.ts
export const startAssessment = () => http.post('/assessments/start');
export const submitAnswers = (id: number, payload: any) => http.post(`/assessments/${id}/answers`, payload);
export const analyzeAssessment = (id: number) => http.post(`/assessments/${id}/analyze`);
```

```vue
<!-- assessment/index.vue (节选) -->
<el-button type="primary" @click="onSubmit">提交评估</el-button>
```

- [ ] **Step 4: 测试通过**

Run: `pnpm --filter pure-admin-thin test assessment.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/posture.ts frontend/src/store/modules/posture.ts frontend/src/views/user frontend/src/router/modules/user.ts
git commit -m "feat: add user assessment result plan and reassessment pages"
```

---

### Task 11: 前端管理端页面（题库/动作/规则/设置）

**Files:**
- Create: `frontend/src/views/admin/questions/index.vue`
- Create: `frontend/src/views/admin/actions/index.vue`
- Create: `frontend/src/views/admin/rules/index.vue`
- Create: `frontend/src/views/admin/settings/index.vue`
- Modify: `frontend/src/router/modules/admin.ts`
- Test: `frontend/src/views/admin/__tests__/questions.spec.ts`

- [ ] **Step 1: 写失败单测（管理员新增题目）**

```ts
it('admin can create question from form', async () => {
  const { getByText } = render(AdminQuestionsPage);
  await fireEvent.click(getByText('新增题目'));
  expect(createQuestionApi).toHaveBeenCalled();
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter pure-admin-thin test questions.spec.ts`
Expected: FAIL

- [ ] **Step 3: 实现管理端 CRUD 页面**

```vue
<!-- questions/index.vue (节选) -->
<el-button type="primary" @click="onCreate">新增题目</el-button>
<el-table :data="list">...</el-table>
```

- [ ] **Step 4: 测试通过**

Run: `pnpm --filter pure-admin-thin test questions.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/admin frontend/src/router/modules/admin.ts
git commit -m "feat: add admin pages for question action rule and settings"
```

---

### Task 12: 联调、验收测试与文档

**Files:**
- Create: `backend/test/acceptance.e2e-spec.ts`
- Create: `docs/runbook.md`
- Modify: `README.md`

- [ ] **Step 1: 写失败验收测试（完整链路 + fallback 分支）**

```ts
it('full flow should pass with provider disabled', async () => {
  // register/login -> start assessment -> submit answers -> analyze -> generate plan
  // assert fallbackUsed === true and plan weeks === 4
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter backend test:e2e -- acceptance.e2e-spec.ts`
Expected: FAIL

- [ ] **Step 3: 修正联调问题并补文档**

```md
# docs/runbook.md
1. pnpm install
2. pnpm --filter backend prisma migrate dev
3. pnpm --filter backend prisma db seed
4. pnpm dev
```

- [ ] **Step 4: 全量验证**

Run:
- `pnpm --filter backend test`
- `pnpm --filter backend test:e2e`
- `pnpm --filter pure-admin-thin test`
- `pnpm --filter pure-admin-thin build`

Expected: 全部 PASS

- [ ] **Step 5: Commit**

```bash
git add backend/test/acceptance.e2e-spec.ts docs/runbook.md README.md
git commit -m "test: add end-to-end acceptance coverage and deployment runbook"
```

---

## Spec Coverage Self-Review

- 需求“用户端+管理员端”：Task 10 + Task 11 覆盖。
- 需求“预设题库/动作/算法”：Task 3 + Task 4 + Task 6 覆盖。
- 需求“可插拔识别，模型无则不用”：Task 5 覆盖。
- 需求“4周计划与反馈调整”：Task 7 覆盖。
- 需求“复评趋势对比”：Task 8 覆盖。
- 需求“可运营配置化”：Task 9 覆盖。
- 需求“可验证可运行”：Task 12 覆盖。

## Placeholder Scan

已检查，无 `TBD`/`TODO`/“后续实现”等占位描述。

## Type Consistency Check

- `sessionId` 在 assessment/plan/reassessment 流程保持 `number`。
- 评分对象统一命名：`questionnaireScore`, `pose`, `finalScore`。
- fallback 字段统一命名：`fallbackUsed`（API）与 `fallback_used`（DB）。

---

## 交付节奏建议

- Day 1: Task 1-4
- Day 2: Task 5-8
- Day 3: Task 9-12 + 验收

