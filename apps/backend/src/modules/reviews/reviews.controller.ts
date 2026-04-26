import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('reviews')
  @Public()
  @ApiOperation({ summary: 'Soumettre un avis (sera modéré)' })
  create(@Body() dto: CreateReviewDto) {
    return this.reviewsService.create(dto);
  }

  @Get('admin/reviews')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tous les avis pour modération (admin)' })
  @ApiQuery({ name: 'approved', required: false, type: Boolean })
  findAllAdmin(@Query('approved') approved?: string) {
    const isApproved = approved !== undefined ? approved === 'true' : undefined;
    return this.reviewsService.findAllAdmin(isApproved);
  }

  @Patch('reviews/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approuver ou rejeter un avis (admin)' })
  moderate(@Param('id') id: string, @Body() dto: ModerateReviewDto) {
    return this.reviewsService.moderate(id, dto.isApproved);
  }
}
