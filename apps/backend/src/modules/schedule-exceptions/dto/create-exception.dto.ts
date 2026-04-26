import { IsISO8601, IsOptional, IsString, Length } from 'class-validator';

export class CreateExceptionDto {
  @IsISO8601() startDate!: string;
  @IsISO8601() endDate!: string;
  @IsOptional() @IsString() @Length(0, 200) reason?: string;
}
