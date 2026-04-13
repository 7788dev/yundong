import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class LogProgressDto {
  @IsBoolean()
  done!: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  painLevel?: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
