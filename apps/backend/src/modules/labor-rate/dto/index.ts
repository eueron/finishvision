import { IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class CreateLaborRateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(0)
  ratePerUnit: number;

  @IsNumber()
  @Min(0)
  hoursPerUnit: number;

  @IsNumber()
  @Min(0)
  hourlyRate: number;
}

export class UpdateLaborRateDto {
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
  @IsNumber()
  @Min(0)
  ratePerUnit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hoursPerUnit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
