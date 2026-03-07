import { IsString, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEstimateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  markupPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxPercent?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateEstimateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'REVIEW', 'APPROVED', 'SENT', 'ACCEPTED', 'REJECTED'])
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  markupPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxPercent?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddEstimateLineDto {
  @IsOptional()
  @IsString()
  assemblyId?: string;

  @IsOptional()
  @IsString()
  takeoffItemId?: string;

  @IsOptional()
  @IsString()
  categoryCode?: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  materialCost: number;

  @IsNumber()
  @Min(0)
  laborCost: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateEstimateLineDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  materialCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  laborCost?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class GenerateEstimateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  markupPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxPercent?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
