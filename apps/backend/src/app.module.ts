import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000,
        limit: 100,
      },
    ]),

    PrismaModule,
    AuthModule,
    SettingsModule,
    // Resto modules — wired in later milestones :
    // ServiceWindowsModule (M3.2), ScheduleExceptionsModule (M3.4)
    // NotificationsModule (M4.9), BookingsModule (M2.7 - depends on above)
    // HomeSectionsModule (M5.2), MenuDocumentsModule (M5.4), ContactMessagesModule (M5.7)
    // ImagesModule (M4.2), PublicModule (M6.1), StatsModule (M6.2)
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
