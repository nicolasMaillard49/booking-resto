import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';

// NOTE: stub for M1.4 — will be re-wired in M6.1 with new dependencies
// (Settings, ServiceWindows, HomeSections, MenuDocuments, Bookings)
@Module({
  controllers: [PublicController],
})
export class PublicModule {}
