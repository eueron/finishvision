import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AssemblyItemDto {
  @IsEnum(['MATERIAL', 'LABOR'])
  type: 'MATERIAL' | 'LABOR';

  @IsOptional()
  @IsString()
  costItemId?: string;

  @IsOptional()
  @IsString()
  laborRateId?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;
}

export class CreateAssemblyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssemblyItemDto)
  items?: AssemblyItemDto[];
}

export class UpdateAssemblyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
