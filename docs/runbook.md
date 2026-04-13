# Runbook

## 1) 安装依赖

```bash
pnpm install
```

## 2) 初始化后端数据库

```bash
pnpm --filter backend prisma:generate
pnpm --filter backend prisma:migrate --name init
pnpm --filter backend prisma:seed
```

## 3) 启动开发环境

```bash
pnpm dev
```

## 4) 常用验证命令

```bash
pnpm --filter backend lint
pnpm --filter backend test
pnpm --filter backend test:e2e
pnpm --filter pure-admin-thin test
pnpm --filter pure-admin-thin build
```

## 5) 关键接口巡检

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/assessments/start`
- `POST /api/assessments/:id/analyze`
- `POST /api/plans/generate/:sessionId`
- `POST /api/reassessments/compare`
