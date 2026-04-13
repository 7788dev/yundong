import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private async ensureSchema() {
    const statements = [
      `CREATE TABLE IF NOT EXISTS "User" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "username" TEXT NOT NULL UNIQUE,
        "passwordHash" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'user',
        "gender" TEXT,
        "age" INTEGER,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "QuestionBank" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "code" TEXT NOT NULL UNIQUE,
        "category" TEXT NOT NULL,
        "questionText" TEXT NOT NULL,
        "answerType" TEXT NOT NULL DEFAULT 'single',
        "weight" REAL NOT NULL DEFAULT 1,
        "enabled" BOOLEAN NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "QuestionOption" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "questionId" INTEGER NOT NULL,
        "optionText" TEXT NOT NULL,
        "score" REAL NOT NULL,
        "sort" INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS "ActionLibrary" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "code" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "targetProblem" TEXT NOT NULL,
        "level" TEXT NOT NULL DEFAULT 'beginner',
        "contraindications" TEXT,
        "steps" TEXT NOT NULL,
        "durationSec" INTEGER NOT NULL DEFAULT 30,
        "sets" INTEGER NOT NULL DEFAULT 2,
        "enabled" BOOLEAN NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "RuleEngineRule" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "ruleName" TEXT NOT NULL,
        "problemType" TEXT NOT NULL,
        "conditionJson" TEXT NOT NULL,
        "scoreFormula" TEXT,
        "planTemplateJson" TEXT,
        "priority" INTEGER NOT NULL DEFAULT 0,
        "enabled" BOOLEAN NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "AssessmentSession" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "userId" INTEGER NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'started',
        "questionnaireScoreJson" TEXT,
        "poseScoreJson" TEXT,
        "finalScoreJson" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "AssessmentAnswer" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "sessionId" INTEGER NOT NULL,
        "questionId" INTEGER NOT NULL,
        "optionId" INTEGER,
        "rawValue" TEXT,
        "score" REAL NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "PosePhoto" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "sessionId" INTEGER NOT NULL,
        "viewType" TEXT NOT NULL,
        "filePath" TEXT NOT NULL,
        "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "PoseAnalysisResult" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "sessionId" INTEGER NOT NULL,
        "modelName" TEXT,
        "modelVersion" TEXT,
        "landmarksJson" TEXT,
        "metricsJson" TEXT,
        "confidence" REAL NOT NULL DEFAULT 0,
        "fallbackUsed" BOOLEAN NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "DiagnosisResult" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "sessionId" INTEGER NOT NULL,
        "problemType" TEXT NOT NULL,
        "severity" TEXT NOT NULL,
        "evidenceJson" TEXT,
        "adviceText" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "RehabPlan" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "sessionId" INTEGER NOT NULL,
        "userId" INTEGER NOT NULL,
        "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "weeks" INTEGER NOT NULL DEFAULT 4,
        "summary" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "RehabPlanItem" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "planId" INTEGER NOT NULL,
        "weekNo" INTEGER NOT NULL,
        "dayNo" INTEGER NOT NULL,
        "actionId" INTEGER NOT NULL,
        "prescriptionJson" TEXT,
        "notes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "ProgressLog" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "userId" INTEGER NOT NULL,
        "planItemId" INTEGER NOT NULL,
        "done" BOOLEAN NOT NULL DEFAULT 0,
        "painLevel" INTEGER,
        "feedback" TEXT,
        "loggedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "Reassessment" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "userId" INTEGER NOT NULL,
        "baselineSessionId" INTEGER NOT NULL,
        "currentSessionId" INTEGER NOT NULL,
        "improvementJson" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "SystemSetting" (
        "key" TEXT NOT NULL PRIMARY KEY,
        "value" TEXT NOT NULL,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    for (const sql of statements) {
      await this.$executeRawUnsafe(sql);
    }

    await this.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "AssessmentSession_userId_idx" ON "AssessmentSession" ("userId")`,
    );
  }

  async onModuleInit() {
    await this.$connect();
    await this.ensureSchema();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
