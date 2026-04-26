import { IsString, IsNumber, IsOptional, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 'Marie D.' })
  @IsString()
  @MaxLength(50)
  author: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Excellent salon, je recommande vivement !' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
