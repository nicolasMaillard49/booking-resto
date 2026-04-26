import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ServiceWindowsModule } from './modules/service-windows/service-windows.module';
import { ScheduleExceptionsModule } from './modules/schedule-exceptions/schedule-exceptions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ImagesModule } from './modules/images/images.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { HomeSectionsModule } from './modules/home-sections/home-sections.module';
import { MenuDocumentsModule } from './modules/menu-documents/menu-documents.module';
import { ContactMessagesModule } from './modules/contact-messages/contact-messages.module';
import { PublicModule } from './modules/public/public.module';
import { StatsModule } from './modules/stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    ThrottlerModule.forRoot([{ name: 'global', ttl: 60000, limit: 100 }]),

    ScheduleModule.forRoot(),

    PrismaModule,
    AuthModule,
    SettingsModule,
    ServiceWindowsModule,
    ScheduleExceptionsModule,
    NotificationsModule,
    ImagesModule,
    BookingsModule,
    HomeSectionsModule,
    MenuDocumentsModule,
    ContactMessagesModule,
    PublicModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
