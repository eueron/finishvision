import { IsString, IsOptional } from 'class-validator';

export class UpdateBlueprintDto {
  @IsString()
  @IsOptional()
  originalName?: string;
}
