import {
  IsString,
  IsEmail,
  IsDateString,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 'cljxxx123' })
  @IsString()
  serviceId: string;

  @ApiProperty({ example: 'Marie Dupont' })
  @IsString()
  @MaxLength(100)
  clientName: string;

  @ApiProperty({ example: 'marie@example.com' })
  @IsEmail({}, { message: 'Email invalide' })
  clientEmail: string;

  @ApiProperty({ example: '06 12 34 56 78' })
  @IsString()
  @MaxLength(20)
  @Matches(/^[0-9\s\+\-\(\)]+$/, { message: 'Numéro de téléphone invalide' })
  clientPhone: string;

  @ApiProperty({
    example: '2025-06-15T10:00:00.000Z',
    description: 'Date et heure du RDV (ISO 8601)',
  })
  @IsDateString({}, { message: 'Date invalide. Format attendu: ISO 8601' })
  date: string;

  @ApiPropertyOptional({ example: 'Je préfère un brushing naturel' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
