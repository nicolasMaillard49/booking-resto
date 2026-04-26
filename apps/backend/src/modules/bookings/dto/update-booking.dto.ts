import { IsEnum, IsInt, IsISO8601, IsOptional, IsString, Length, Min, Max } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingDto {
  @IsOptional() @IsInt() @Min(1) @Max(50)
  partySize?: number;

  @IsOptional() @IsISO8601()
  date?: string;

  @IsOptional() @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional() @IsString() @Length(0, 500)
  notes?: string;
}
