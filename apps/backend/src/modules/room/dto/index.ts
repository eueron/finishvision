import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  roomType?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class UpdateRoomDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  roomType?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
