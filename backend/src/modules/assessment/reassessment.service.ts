import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReassessmentService {
  constructor(private readonly prisma: PrismaService) {}

  private parseScore(raw: string | null) {
    if (!raw) return 0;
    try {
      return Number((JSON.parse(raw) as { total?: number }).total ?? 0);
    } catch {
      return 0;
    }
  }

  private recommendation(totalDelta: number) {
    if (totalDelta <= -10) return '进阶';
    if (totalDelta >= 10) return '退阶';
    return '维持';
  }

  async compare(
    userId: number,
    baselineSessionId: number,
    currentSessionId: number,
  ) {
    const [baseline, current] = await Promise.all([
      this.prisma.assessmentSession.findUnique({
        where: { id: baselineSessionId },
      }),
      this.prisma.assessmentSession.findUnique({
        where: { id: currentSessionId },
      }),
    ]);

    if (!baseline || !current) {
      throw new NotFoundException('session not found');
    }

    const baselineScore = this.parseScore(baseline.finalScoreJson);
    const currentScore = this.parseScore(current.finalScoreJson);
    const totalDelta = Number((currentScore - baselineScore).toFixed(2));

    const improvement = {
      baselineScore,
      currentScore,
      totalDelta,
      recommendation: this.recommendation(totalDelta),
    };

    const reassessment = await this.prisma.reassessment.create({
      data: {
        userId,
        baselineSessionId,
        currentSessionId,
        improvementJson: JSON.stringify(improvement),
      },
    });

    return {
      id: reassessment.id,
      improvement,
    };
  }
}
