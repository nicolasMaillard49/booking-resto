import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
export class CreateMenuDocumentDto {
  @IsString() @Length(1, 120) title!: string;
  @IsOptional() @IsString() @Length(0, 1000) description?: string;
  @IsString() fileId!: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}
