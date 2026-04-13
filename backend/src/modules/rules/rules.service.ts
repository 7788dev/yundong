import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type RuleInput = {
  questionnaireScore: {
    total: number;
    domains: Record<string, number>;
  };
  poseMetrics: Record<string, number>;
  finalScoreTotal: number;
};

@Injectable()
export class RulesService {
  constructor(private readonly prisma: PrismaService) {}

  private parseJson<T>(value: string | null): T | null {
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  private evaluateCondition(
    condition: Record<string, unknown>,
    input: RuleInput,
  ): boolean {
    const any = condition.any as Array<Record<string, unknown>> | undefined;
    const all = condition.all as Array<Record<string, unknown>> | undefined;

    const evaluatePredicate = (item: Record<string, unknown>) => {
      const domain = item.domain as string | undefined;
      const metric = item.metric as string | undefined;
      const gte = Number(item.gte ?? Number.NEGATIVE_INFINITY);

      if (domain) {
        return (input.questionnaireScore.domains[domain] ?? 0) >= gte;
      }
      if (metric) {
        return (input.poseMetrics[metric] ?? 0) >= gte;
      }
      return false;
    };

    if (Array.isArray(all) && all.length > 0) {
      return all.every(evaluatePredicate);
    }

    if (Array.isArray(any) && any.length > 0) {
      return any.some(evaluatePredicate);
    }

    return false;
  }

  private resolveSeverity(score: number) {
    if (score >= 70) return 'severe';
    if (score >= 40) return 'moderate';
    return 'mild';
  }

  async evaluate(input: RuleInput) {
    const rules = await this.prisma.ruleEngineRule.findMany({
      where: { enabled: true },
      orderBy: { priority: 'desc' },
    });

    const matched = rules
      .filter((rule) => {
        const condition =
          this.parseJson<Record<string, unknown>>(rule.conditionJson) ?? {};
        return this.evaluateCondition(condition, input);
      })
      .map((rule) => ({
        problemType: rule.problemType,
        severity: this.resolveSeverity(input.finalScoreTotal),
        evidence: {
          ruleId: rule.id,
          ruleName: rule.ruleName,
          domains: input.questionnaireScore.domains,
          metrics: input.poseMetrics,
        },
        adviceText: `命中规则：${rule.ruleName}`,
      }));

    return matched;
  }
}
