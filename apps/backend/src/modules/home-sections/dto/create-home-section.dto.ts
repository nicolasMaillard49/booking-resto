import { IsBoolean, IsIn, IsObject, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
export class CreateHomeSectionDto {
  @IsString() @Length(1, 120) title!: string;
  @IsString() @Length(1, 20000) body!: string;
  @IsOptional() @IsString() imageId?: string;
  @IsOptional() @IsIn(['SPLIT', 'FULL']) layout?: 'SPLIT' | 'FULL';
  @IsOptional() @IsString() @Matches(/^(#?[0-9a-fA-F]{3,8})?$/, { message: 'bgColor: hex attendu (ex #1f1f1f)' }) bgColor?: string;
  @IsOptional() @IsString() @MaxLength(80) ctaLabel?: string;
  @IsOptional() @IsString() @MaxLength(500) ctaUrl?: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
  @IsOptional() @IsObject() translations?: Record<string, { title?: string; body?: string; ctaLabel?: string }>;
}
