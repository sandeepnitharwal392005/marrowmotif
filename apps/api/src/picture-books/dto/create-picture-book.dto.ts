import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { DeliveryPreference } from '@prisma/client';

export class CreatePictureBookDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title: string;

  @IsEnum(DeliveryPreference)
  @IsOptional()
  deliveryPreference?: DeliveryPreference;

  @IsDateString()
  @IsOptional()
  departureDate?: string;

  @IsString()
  @IsOptional()
  departureTime?: string;

  @IsString()
  @IsOptional()
  flightNumber?: string;

  @IsString()
  @IsOptional()
  departureAirport?: string;

  @IsString()
  @IsOptional()
  deliveryAddressLine1?: string;

  @IsString()
  @IsOptional()
  deliveryAddressLine2?: string;

  @IsString()
  @IsOptional()
  deliveryCity?: string;

  @IsString()
  @IsOptional()
  deliveryState?: string;

  @IsString()
  @IsOptional()
  deliveryPostalCode?: string;

  @IsString()
  @IsOptional()
  deliveryCountry?: string;
}
