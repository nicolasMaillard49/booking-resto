import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { ServicesModule } from '../services/services.module';
import { AvailabilityModule } from '../availability/availability.module';
import { BookingsModule } from '../bookings/bookings.module';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  imports: [ServicesModule, AvailabilityModule, BookingsModule, ReviewsModule],
  controllers: [PublicController],
})
export class PublicModule {}
