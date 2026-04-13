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

@Controller('admin/actions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ActionsAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.actionLibrary.findMany({ orderBy: { id: 'asc' } });
  }

  @Post()
  create(
    @Body()
    body: {
      code: string;
      name: string;
      targetProblem: string;
      level?: string;
      contraindications?: string;
      steps: string;
      durationSec?: number;
      sets?: number;
      enabled?: boolean;
    },
  ) {
    return this.prisma.actionLibrary.create({
      data: {
        code: body.code,
        name: body.name,
        targetProblem: body.targetProblem,
        level: body.level ?? 'beginner',
        contraindications: body.contraindications,
        steps: body.steps,
        durationSec: body.durationSec ?? 30,
        sets: body.sets ?? 2,
        enabled: body.enabled ?? true,
      },
    });
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
  ) {
    return this.prisma.actionLibrary.update({
      where: { id },
      data: body,
    });
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.actionLibrary.delete({ where: { id } });
  }
}
