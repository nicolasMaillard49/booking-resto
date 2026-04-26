import { ArrayMinSize, ArrayUnique, IsArray, IsBoolean, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateServiceWindowDto {
  @IsString() @Length(1, 50)
  label!: string;

  @IsArray() @ArrayMinSize(1) @ArrayUnique()
  @IsInt({ each: true }) @Min(1, { each: true }) @Max(7, { each: true })
  daysOfWeek!: number[];

  @IsString() @Matches(HHMM, { message: 'startTime doit être HH:mm' })
  startTime!: string;

  @IsString() @Matches(HHMM, { message: 'endTime doit être HH:mm' })
  endTime!: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
