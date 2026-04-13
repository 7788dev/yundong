import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UploadPhotoItemDto {
  @IsIn(['front', 'side', 'back'])
  viewType!: 'front' | 'side' | 'back';

  @IsString()
  filePath!: string;
}

export class UploadPhotosDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadPhotoItemDto)
  photos!: UploadPhotoItemDto[];
}

export class AnalyzeAssessmentDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  filePaths?: string[];

  @IsOptional()
  injectedMetrics?: Record<string, number>;
}
