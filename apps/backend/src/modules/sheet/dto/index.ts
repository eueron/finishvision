import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

export class UpdateSheetDto {
  @IsString()
  @IsOptional()
  sheetName?: string;

  @IsString()
  @IsOptional()
  sheetType?: string;

  @IsString()
  @IsOptional()
  scaleText?: string;

  @IsNumber()
  @IsOptional()
  scaleFactor?: number;
}
