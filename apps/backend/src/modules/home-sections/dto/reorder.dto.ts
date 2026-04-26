import { IsArray, IsString } from 'class-validator';
export class ReorderHomeSectionsDto { @IsArray() @IsString({ each: true }) ids!: string[]; }
