import { IsString, IsOptional, MaxLength, Matches, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBlockedSlotDto {
  @ApiProperty({ example: '2025-08-15', description: 'Date du blocage (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Format heure invalide (HH:mm)' })
  startTime: string;

  @ApiProperty({ example: '19:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Format heure invalide (HH:mm)' })
  endTime: string;

  @ApiPropertyOptional({ example: 'Congés annuels' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
