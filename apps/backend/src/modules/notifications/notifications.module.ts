import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { MailerService, MAILER_PROVIDER } from './mailer/mailer.service';
import { NodemailerProvider } from './mailer/nodemailer.provider';
import { ResendProvider } from './mailer/resend.provider';
import { NotificationsService } from './notifications.service';
import { ReminderCron } from './jobs/reminder.cron';
import { ReviewRequestCron } from './jobs/review-request.cron';

@Module({
  imports: [PrismaModule, SettingsModule, ConfigModule],
  providers: [
    NotificationsService,
    MailerService,
    ReminderCron,
    ReviewRequestCron,
    {
      provide: MAILER_PROVIDER,
      useFactory: (config: ConfigService) =>
        process.env.NODE_ENV === 'production'
          ? new ResendProvider(config)
          : new NodemailerProvider(config),
      inject: [ConfigService],
    },
  ],
  exports: [NotificationsService, MailerService],
})
export class NotificationsModule {}
