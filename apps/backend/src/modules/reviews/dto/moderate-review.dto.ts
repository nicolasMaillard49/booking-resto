import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ModerateReviewDto {
  @ApiProperty({ description: 'true = approuver, false = rejeter' })
  @IsBoolean()
  isApproved: boolean;
}
