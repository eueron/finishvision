import { IsString, IsOptional, IsEnum, IsObject, IsBoolean } from 'class-validator';

export class CreateAnnotationDto {
  @IsEnum(['CALIBRATION', 'MEASUREMENT', 'MARKER', 'NOTE'])
  type: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsObject()
  data: Record<string, any>;

  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateAnnotationDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsString()
  @IsOptional()
  color?: string;

  @IsBoolean()
  @IsOptional()
  visible?: boolean;
}
