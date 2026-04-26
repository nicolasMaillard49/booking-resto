import { IsArray, IsString } from 'class-validator';
export class ReorderImagesDto {
  @IsArray() @IsString({ each: true })
  ids!: string[];
}
