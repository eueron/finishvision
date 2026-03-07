import { IsString, IsOptional, IsEnum, IsNumber, IsObject, IsBoolean, IsArray } from 'class-validator';

export class CreateTakeoffItemDto {
  @IsString()
  categoryId: string;

  @IsString()
  @IsOptional()
  sheetId?: string;

  @IsString()
  @IsOptional()
  roomId?: string;

  @IsEnum(['MANUAL', 'AI_DETECTED', 'AI_CONFIRMED'])
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  length?: number;

  @IsNumber()
  @IsOptional()
  width?: number;

  @IsNumber()
  @IsOptional()
  area?: number;

  @IsObject()
  @IsOptional()
  coordinates?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  confidence?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateTakeoffItemDto {
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  roomId?: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  length?: number;

  @IsNumber()
  @IsOptional()
  width?: number;

  @IsNumber()
  @IsOptional()
  area?: number;

  @IsObject()
  @IsOptional()
  coordinates?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class BulkCreateTakeoffItemDto {
  @IsArray()
  items: CreateTakeoffItemDto[];
}
