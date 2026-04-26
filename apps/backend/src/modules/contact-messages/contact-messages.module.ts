import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ContactMessagesController } from './contact-messages.controller';
import { ContactMessagesService } from './contact-messages.service';
import { CaptchaService } from './captcha.service';

@Module({
  imports: [PrismaModule, NotificationsModule, ConfigModule],
  controllers: [ContactMessagesController],
  providers: [ContactMessagesService, CaptchaService],
  exports: [ContactMessagesService],
})
export class ContactMessagesModule {}
