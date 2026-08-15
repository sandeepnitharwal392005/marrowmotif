import { IsString, IsOptional, IsEnum } from 'class-validator';
import { IncidentStatus, IncidentPriority } from '@prisma/client';

export class UpdateIncidentDto {
  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;

  @IsEnum(IncidentPriority)
  @IsOptional()
  priority?: IncidentPriority;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}
