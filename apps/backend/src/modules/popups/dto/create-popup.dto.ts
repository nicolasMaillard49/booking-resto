import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator';

export class CreatePopupDto {
  @IsString() @Length(1, 120) title!: string;
  @IsString() @Length(1, 8000) body!: string;
  @IsOptional() @IsString() imageId?: string;
  @IsOptional() @IsString() @MaxLength(80) ctaLabel?: string;
  @IsOptional() @IsString() @MaxLength(500) ctaUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsIn(['ON_LOAD', 'AFTER_DELAY']) trigger?: 'ON_LOAD' | 'AFTER_DELAY';
  @IsOptional() @IsInt() @Min(0) delaySeconds?: number;
  @IsOptional() @IsBoolean() showOncePerSession?: boolean;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}
