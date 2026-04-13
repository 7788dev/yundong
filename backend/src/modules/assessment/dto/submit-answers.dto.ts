import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AssessmentAnswerItemDto {
  @IsInt()
  questionId!: number;

  @IsOptional()
  @IsInt()
  optionId?: number;

  @IsOptional()
  @IsString()
  rawValue?: string;
}

export class SubmitAnswersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssessmentAnswerItemDto)
  answers!: AssessmentAnswerItemDto[];
}
