import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlansService } from './plans.service';
import { LogProgressDto } from './dto/log-progress.dto';

@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post('generate/:sessionId')
  generate(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.plansService.generate(sessionId);
  }

  @Get(':id')
  getPlan(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.getPlan(id);
  }

  @Post(':id/items/:itemId/log')
  logProgress(
    @Req() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: LogProgressDto,
  ) {
    return this.plansService.logProgress(req.user.id, id, itemId, dto);
  }
}
