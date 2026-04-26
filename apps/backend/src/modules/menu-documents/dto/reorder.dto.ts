import { IsArray, IsString } from 'class-validator';
export class ReorderMenuDocumentsDto { @IsArray() @IsString({ each: true }) ids!: string[]; }
