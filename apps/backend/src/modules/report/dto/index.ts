import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class GenerateReportDto {
  @IsEnum(['TAKEOFF_SUMMARY', 'ESTIMATE_SUMMARY', 'PROPOSAL'])
  type: 'TAKEOFF_SUMMARY' | 'ESTIMATE_SUMMARY' | 'PROPOSAL';

  @IsEnum(['PDF', 'CSV', 'JSON'])
  @IsOptional()
  format?: 'PDF' | 'CSV' | 'JSON' = 'PDF';

  @IsUUID()
  @IsOptional()
  estimateId?: string;

  @IsString()
  @IsOptional()
  name?: string;
}
