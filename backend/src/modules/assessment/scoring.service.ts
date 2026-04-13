import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type DomainKey = 'neck_shoulder' | 'thoracic' | 'pelvis' | 'lower_limb';

@Injectable()
export class ScoringService {
  constructor(private readonly prisma: PrismaService) {}

  private normalize(value: number) {
    return Math.max(0, Math.min(100, Number(value.toFixed(2))));
  }

  async computeQuestionnaireScore(sessionId: number) {
    const answers = await this.prisma.assessmentAnswer.findMany({
      where: { sessionId },
      include: {
        question: true,
        option: true,
      },
    });

    const buckets: Record<DomainKey, { weighted: number; weight: number }> = {
      neck_shoulder: { weighted: 0, weight: 0 },
      thoracic: { weighted: 0, weight: 0 },
      pelvis: { weighted: 0, weight: 0 },
      lower_limb: { weighted: 0, weight: 0 },
    };

    for (const answer of answers) {
      const category = answer.question.category as DomainKey;
      if (!(category in buckets)) continue;
      const score = answer.option?.score ?? answer.score ?? 0;
      const weight = answer.question.weight;
      buckets[category].weighted += score * weight;
      buckets[category].weight += weight;
    }

    const domains = Object.fromEntries(
      Object.entries(buckets).map(([key, value]) => {
        const avg = value.weight === 0 ? 0 : value.weighted / value.weight;
        return [key, this.normalize(avg)];
      }),
    ) as Record<DomainKey, number>;

    const total = this.normalize(
      (domains.neck_shoulder +
        domains.thoracic +
        domains.pelvis +
        domains.lower_limb) /
        4,
    );

    return {
      total,
      domains,
    };
  }

  computeFinalScore(
    questionnaireTotal: number,
    poseTotal: number,
    fallbackUsed: boolean,
  ) {
    const total = fallbackUsed
      ? questionnaireTotal
      : Number((questionnaireTotal * 0.65 + poseTotal * 0.35).toFixed(2));

    return {
      total: this.normalize(total),
      weights: {
        questionnaire: fallbackUsed ? 1 : 0.65,
        pose: fallbackUsed ? 0 : 0.35,
      },
    };
  }
}
