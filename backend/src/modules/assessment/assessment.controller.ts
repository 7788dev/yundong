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
import { AssessmentService } from './assessment.service';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { AnalyzeAssessmentDto, UploadPhotosDto } from './dto/upload-photos.dto';
import { CompareReassessmentDto } from './dto/compare-reassessment.dto';
import { ReassessmentService } from './reassessment.service';

@Controller('assessments')
@UseGuards(JwtAuthGuard)
export class AssessmentController {
  constructor(
    private readonly assessmentService: AssessmentService,
    private readonly reassessmentService: ReassessmentService,
  ) {}

  @Post('start')
  start(@Req() req: { user: { id: number } }) {
    return this.assessmentService.start(req.user.id);
  }

  @Post(':id/answers')
  submitAnswers(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitAnswersDto,
  ) {
    return this.assessmentService.submitAnswers(id, dto.answers);
  }

  @Post(':id/photos')
  uploadPhotos(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UploadPhotosDto,
  ) {
    return this.assessmentService.uploadPhotos(id, dto.photos);
  }

  @Post(':id/analyze')
  analyze(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnalyzeAssessmentDto,
  ) {
    return this.assessmentService.analyze(id, dto);
  }

  @Get(':id/result')
  result(@Param('id', ParseIntPipe) id: number) {
    return this.assessmentService.result(id);
  }

  @Post('/reassessments/compare')
  compareReassessment(
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
