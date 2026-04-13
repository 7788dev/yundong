import { Module } from '@nestjs/common';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { ScoringService } from './scoring.service';
import { ReassessmentService } from './reassessment.service';
import { PoseModule } from '../pose/pose.module';
import { RulesModule } from '../rules/rules.module';
import { ReassessmentsController } from './reassessments.controller';

@Module({
  imports: [PoseModule, RulesModule],
  controllers: [AssessmentController, ReassessmentsController],
  providers: [AssessmentService, ScoringService, ReassessmentService],
  exports: [AssessmentService, ReassessmentService],
})
export class AssessmentModule {}
