import { IsString, IsNotEmpty, IsOptional, IsInt, IsArray, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RoomTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  roomType?: string;
}

export class CreateUnitDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  unitType?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomTemplateDto)
  @IsOptional()
  rooms?: RoomTemplateDto[];
}

export class UpdateUnitDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  unitType?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class BulkCreateUnitsDto {
  @IsString()
  @IsNotEmpty()
  prefix: string;

  @IsInt()
  @Min(1)
  startNumber: number;

  @IsInt()
  @Min(1)
  count: number;

  @IsString()
  @IsOptional()
  unitType?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomTemplateDto)
  @IsOptional()
  roomTemplate?: RoomTemplateDto[];
}
