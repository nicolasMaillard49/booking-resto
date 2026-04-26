import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { ServiceWindowsModule } from '../service-windows/service-windows.module';
import { HomeSectionsModule } from '../home-sections/home-sections.module';
import { MenuDocumentsModule } from '../menu-documents/menu-documents.module';
import { BookingsModule } from '../bookings/bookings.module';
import { PublicController } from './public.controller';

@Module({
  imports: [SettingsModule, ServiceWindowsModule, HomeSectionsModule, MenuDocumentsModule, BookingsModule],
  controllers: [PublicController],
})
export class PublicModule {}
