import { IsArray, ValidateNested, IsInt, IsString, IsBoolean, Min, Max, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class DayScheduleDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Format heure invalide (HH:mm)' })
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Format heure invalide (HH:mm)' })
  endTime: string;

  @IsBoolean()
  isActive: boolean;
}

export class UpdateScheduleDto {
  @ApiProperty({ type: [DayScheduleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayScheduleDto)
  schedule: DayScheduleDto[];
}
