import { IsString, IsNumber, IsOptional, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'Coupe femme' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 60, description: 'Durée en minutes' })
  @IsNumber()
  @Min(5)
  @Max(480)
  duration: number;

  @ApiProperty({ example: 55, description: 'Prix en euros' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'Coupes' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
