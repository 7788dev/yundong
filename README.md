# 体态评估与康复计划平台

基于 **pure-admin-thin + NestJS + SQLite + Prisma** 的体态问题分析与康复计划平台。

## 功能范围（MVP）

- 用户端：问卷评估、结果查看、4周康复计划、复评对比
- 管理端：题库管理、动作库管理、规则管理、模型配置
- 后端：认证鉴权、评分引擎、规则引擎、可插拔姿态分析、计划生成

## 目录结构

```text
.
├─ frontend/   # pure-admin-thin 前端
├─ backend/    # NestJS + Prisma API
└─ docs/
```

## 快速启动

```bash
pnpm install
pnpm --filter backend prisma:generate
pnpm --filter backend prisma:migrate --name init
pnpm --filter backend prisma:seed
pnpm dev
```

默认访问：

- 前端：http://localhost:5173
- 后端：http://localhost:3000/api

## 测试与构建

```bash
pnpm --filter backend test
pnpm --filter backend test:e2e
pnpm --filter pure-admin-thin test
pnpm --filter pure-admin-thin build
```

## 默认测试账号（后端 seed）

- 管理员：`admin / Admin123!`
- 普通用户：`demo / User12345!`
