import { IsInt } from 'class-validator';

export class CompareReassessmentDto {
  @IsInt()
  baselineSessionId!: number;

  @IsInt()
  currentSessionId!: number;
}
