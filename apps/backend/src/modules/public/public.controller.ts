import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { siteConfig } from '@booking-pro/shared';
import { ServicesService } from '../services/services.service';
import { AvailabilityService } from '../availability/availability.service';
import { BookingsService } from '../bookings/bookings.service';
import { ReviewsService } from '../reviews/reviews.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('public')
@Public()
@Controller('public')
export class PublicController {
  constructor(
    private readonly services: ServicesService,
    private readonly availability: AvailabilityService,
    private readonly bookings: BookingsService,
    private readonly reviews: ReviewsService,
  ) {}

  @Get('site')
  @ApiOperation({ summary: 'Infos publiques du site (identité, contact, branding)' })
  getSite() {
    return siteConfig;
  }

  @Get('services')
  @ApiOperation({ summary: 'Liste publique des services actifs' })
  getServices() {
    return this.services.findPublic();
  }

  @Get('schedule')
  @ApiOperation({ summary: 'Horaires hebdomadaires publics' })
  getSchedule() {
    return this.availability.getSchedule();
  }

  @Get('availability-slots')
  @ApiOperation({ summary: 'Créneaux disponibles pour un jour donné' })
  @ApiQuery({ name: 'date', required: true, description: 'Format: YYYY-MM-DD' })
  @ApiQuery({ name: 'duration', required: false, description: 'Durée du service en minutes' })
  getAvailabilitySlots(
    @Query('date') date: string,
    @Query('duration') duration?: string,
  ) {
    return this.bookings.getAvailability(date, duration ? Number(duration) : undefined);
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Avis approuvés publics' })
  getReviews() {
    return this.reviews.findPublic();
  }
}
