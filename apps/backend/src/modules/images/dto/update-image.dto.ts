import { IsEnum, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { ImageSection } from '@prisma/client';

export class UpdateImageDto {
  @IsOptional() @IsString() @Length(0, 200) caption?: string;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsEnum(ImageSection) section?: ImageSection;
}
