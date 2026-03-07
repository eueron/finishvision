import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class TriggerAiAnalysisDto {
  @IsUUID()
  sheetId: string;

  @IsOptional()
  @IsString({ each: true })
  steps?: ('ocr' | 'detection' | 'classification')[];
}

export class ReviewDetectionDto {
  @IsEnum(['ACCEPTED', 'REJECTED', 'MODIFIED'])
  status: 'ACCEPTED' | 'REJECTED' | 'MODIFIED';

  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  label?: string;
}

export class BulkReviewDto {
  @IsUUID(undefined, { each: true })
  detectionIds: string[];

  @IsEnum(['ACCEPTED', 'REJECTED'])
  status: 'ACCEPTED' | 'REJECTED';
}
