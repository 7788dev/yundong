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

@Controller('admin/questions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class QuestionsAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.questionBank.findMany({
      include: { options: { orderBy: { sort: 'asc' } } },
      orderBy: { id: 'asc' },
    });
  }

  @Post()
  create(
    @Body()
    body: {
      code: string;
      category: string;
      questionText: string;
      answerType?: string;
      weight?: number;
      enabled?: boolean;
    },
  ) {
    return this.prisma.questionBank.create({
      data: {
        code: body.code,
        category: body.category,
        questionText: body.questionText,
        answerType: body.answerType ?? 'single',
        weight: body.weight ?? 1,
        enabled: body.enabled ?? true,
      },
    });
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      category?: string;
      questionText?: string;
      answerType?: string;
      weight?: number;
      enabled?: boolean;
    },
  ) {
    return this.prisma.questionBank.update({
      where: { id },
      data: body,
    });
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.questionBank.delete({ where: { id } });
  }
}
