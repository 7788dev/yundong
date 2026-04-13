import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UsersAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        gender: true,
        age: true,
        createdAt: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  @Get(':id/sessions')
  sessions(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.assessmentSession.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        diagnosisResults: true,
      },
    });
  }
}
