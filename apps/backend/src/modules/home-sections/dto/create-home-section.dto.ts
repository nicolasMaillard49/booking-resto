import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
export class CreateHomeSectionDto {
  @IsString() @Length(1, 120) title!: string;
  @IsString() @Length(1, 4000) body!: string;
  @IsOptional() @IsString() imageId?: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}
