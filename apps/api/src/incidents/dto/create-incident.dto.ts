import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { IncidentPriority } from '@prisma/client';

export class CreateIncidentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  pictureBookId?: string;

  @IsEnum(IncidentPriority)
  @IsOptional()
  priority?: IncidentPriority;
}
