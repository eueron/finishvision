import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  defaultMarkup?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  defaultTaxRate?: number;
}
