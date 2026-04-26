import { Transform } from 'class-transformer';
import { IsEnum, IsISO8601, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class GetBookingsQueryDto {
  @IsOptional() @IsISO8601() from?: string;
  @IsOptional() @IsISO8601() to?: string;
  @IsOptional() @IsEnum(BookingStatus) status?: BookingStatus;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Transform(({ value }) => parseInt(value, 10)) @IsInt() @Min(1) page?: number;
  @IsOptional() @Transform(({ value }) => parseInt(value, 10)) @IsInt() @Min(1) pageSize?: number;
}
