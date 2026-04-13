import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LogProgressDto } from './dto/log-progress.dto';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  private parseJson<T>(value: string | null): T | null {
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  private async selectActions(problemTypes: string[]) {
    const actions = await this.prisma.actionLibrary.findMany({
      where: {
        enabled: true,
        targetProblem: {
          in: problemTypes,
        },
      },
      orderBy: { id: 'asc' },
    });

    if (actions.length > 0) {
      return actions;
    }

    return this.prisma.actionLibrary.findMany({
      where: { enabled: true },
      orderBy: { id: 'asc' },
      take: 4,
    });
  }

  async generate(sessionId: number) {
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: { diagnosisResults: true },
    });

    if (!session) {
      throw new NotFoundException('session not found');
    }

    const problemTypes = session.diagnosisResults.map(
      (item) => item.problemType,
    );
    const actions = await this.selectActions(problemTypes);

    const plan = await this.prisma.rehabPlan.create({
      data: {
        sessionId,
        userId: session.userId,
        weeks: 4,
        summary: `针对${problemTypes.join('、') || '综合体态'}的4周康复计划`,
      },
    });

    const items: Array<{
      weekNo: number;
      dayNo: number;
      actionId: number;
      prescriptionJson: Record<string, unknown>;
      notes: string;
    }> = [];

    for (let week = 1; week <= 4; week += 1) {
      for (let day = 1; day <= 3; day += 1) {
        for (const action of actions.slice(0, 3)) {
          items.push({
            weekNo: week,
            dayNo: day,
            actionId: action.id,
            prescriptionJson: {
              durationSec: action.durationSec + (week - 1) * 5,
              sets: action.sets + Math.floor((week - 1) / 2),
            },
            notes: `第${week}周第${day}天，动作：${action.name}`,
          });
        }
      }
    }

    await this.prisma.rehabPlanItem.createMany({
      data: items.map((item) => ({
        planId: plan.id,
        weekNo: item.weekNo,
        dayNo: item.dayNo,
        actionId: item.actionId,
        prescriptionJson: JSON.stringify(item.prescriptionJson),
        notes: item.notes,
      })),
    });

    const planWithItems = await this.prisma.rehabPlan.findUnique({
      where: { id: plan.id },
      include: {
        items: {
          include: { action: true },
          orderBy: [{ weekNo: 'asc' }, { dayNo: 'asc' }, { id: 'asc' }],
        },
      },
    });

    return {
      ...planWithItems,
      items:
        planWithItems?.items.map((item) => ({
          ...item,
          prescriptionJson: this.parseJson(item.prescriptionJson),
        })) ?? [],
    };
  }

  async getPlan(planId: number) {
    const plan = await this.prisma.rehabPlan.findUnique({
      where: { id: planId },
      include: {
        items: {
          include: { action: true },
          orderBy: [{ weekNo: 'asc' }, { dayNo: 'asc' }, { id: 'asc' }],
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('plan not found');
    }

    return {
      ...plan,
      items: plan.items.map((item) => ({
        ...item,
        prescriptionJson: this.parseJson(item.prescriptionJson),
      })),
    };
  }

  async logProgress(
    userId: number,
    planId: number,
    itemId: number,
    dto: LogProgressDto,
  ) {
    const plan = await this.prisma.rehabPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      throw new NotFoundException('plan not found');
    }

    const item = await this.prisma.rehabPlanItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.planId !== planId) {
      throw new NotFoundException('plan item not found');
    }

    const log = await this.prisma.progressLog.create({
      data: {
        userId,
        planItemId: itemId,
        done: dto.done,
        painLevel: dto.painLevel,
        feedback: dto.feedback,
      },
    });

    const adjustment =
      dto.painLevel !== undefined && dto.painLevel >= 7 ? 'regress' : 'keep';
    return {
      ...log,
      adjustment,
    };
  }
}
