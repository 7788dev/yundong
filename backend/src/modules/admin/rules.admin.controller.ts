import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RulesService } from '../rules/rules.service';

@Controller('admin/rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class RulesAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rulesService: RulesService,
  ) {}

  @Get()
  async list() {
    const rules = await this.prisma.ruleEngineRule.findMany({
      orderBy: [{ priority: 'desc' }, { id: 'asc' }],
    });
    return rules.map((rule) => ({
      ...rule,
      conditionJson: JSON.parse(rule.conditionJson),
      planTemplateJson: rule.planTemplateJson
        ? JSON.parse(rule.planTemplateJson)
        : null,
    }));
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.prisma.ruleEngineRule.create({
      data: {
        ruleName: String(body.ruleName),
        problemType: String(body.problemType),
        conditionJson: JSON.stringify((body.conditionJson ?? {}) as object),
        scoreFormula: body.scoreFormula ? String(body.scoreFormula) : null,
        planTemplateJson:
          body.planTemplateJson !== undefined
            ? JSON.stringify(body.planTemplateJson as object)
            : null,
        priority: Number(body.priority ?? 0),
        enabled: body.enabled !== false,
      },
    });
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
  ) {
    return this.prisma.ruleEngineRule.update({
      where: { id },
      data: {
        ruleName: body.ruleName ? String(body.ruleName) : undefined,
        problemType: body.problemType ? String(body.problemType) : undefined,
        conditionJson:
          body.conditionJson !== undefined
            ? JSON.stringify(body.conditionJson as object)
            : undefined,
        scoreFormula: body.scoreFormula ? String(body.scoreFormula) : undefined,
        planTemplateJson:
          body.planTemplateJson !== undefined
            ? JSON.stringify(body.planTemplateJson as object)
            : undefined,
        priority:
          body.priority !== undefined ? Number(body.priority) : undefined,
        enabled: body.enabled !== undefined ? Boolean(body.enabled) : undefined,
      },
    });
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.ruleEngineRule.delete({ where: { id } });
  }

  @Post('test')
  async test(
    @Body()
    body: {
      questionnaireScore?: { total?: number; domains?: Record<string, number> };
      poseMetrics?: Record<string, number>;
      finalScoreTotal?: number;
    },
  ) {
    const questionnaireScore = {
      total: body.questionnaireScore?.total ?? 0,
      domains: body.questionnaireScore?.domains ?? {},
    };
    return this.rulesService.evaluate({
      questionnaireScore,
      poseMetrics: body.poseMetrics ?? {},
      finalScoreTotal: body.finalScoreTotal ?? questionnaireScore.total,
    });
  }
}
