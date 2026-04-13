import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PoseService } from '../pose/pose.service';

@Controller('admin/system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SettingsAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly poseService: PoseService,
  ) {}

  @Get('model-config')
  async getModelConfig() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'pose_model' },
    });
    if (!setting?.value) return {};
    try {
      return JSON.parse(setting.value) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  @Put('model-config')
  async updateModelConfig(@Body() body: Record<string, unknown>) {
    const value = {
      provider: body.provider ?? process.env.POSE_PROVIDER ?? 'disabled',
      threshold: Number(body.threshold ?? 0.5),
      fallback: body.fallback !== false,
    };

    const updated = await this.prisma.systemSetting.upsert({
      where: { key: 'pose_model' },
      update: { value: JSON.stringify(value) },
      create: { key: 'pose_model', value: JSON.stringify(value) },
    });

    if (typeof value.provider === 'string') {
      process.env.POSE_PROVIDER = value.provider;
    }

    return {
      ...updated,
      status: await this.poseService.status(),
    };
  }
}
