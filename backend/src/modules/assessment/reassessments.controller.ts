import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompareReassessmentDto } from './dto/compare-reassessment.dto';
import { ReassessmentService } from './reassessment.service';

@Controller('reassessments')
@UseGuards(JwtAuthGuard)
export class ReassessmentsController {
  constructor(private readonly reassessmentService: ReassessmentService) {}

  @Post('compare')
  compare(
    @Req() req: { user: { id: number } },
    @Body() dto: CompareReassessmentDto,
  ) {
    return this.reassessmentService.compare(
      req.user.id,
      dto.baselineSessionId,
      dto.currentSessionId,
    );
  }
}
