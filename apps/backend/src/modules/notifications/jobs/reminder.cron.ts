import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class ReminderCron {
  private readonly logger = new Logger(ReminderCron.name);

  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  @Cron('0 10 * * *', { timeZone: 'Europe/Paris' })
  async run() {
    const now = new Date();
    const lower = new Date(now.getTime() + 23 * 3600 * 1000);
    const upper = new Date(now.getTime() + 25 * 3600 * 1000);
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        date: { gte: lower, lte: upper },
        reminderSentAt: null,
      },
      include: { serviceWindow: true },
    });
    this.logger.log(`Cron rappel J-1 : ${bookings.length} résa à notifier`);
    for (const b of bookings) {
      try {
        await this.notifications.onBookingReminder(b);
        await this.prisma.booking.update({ where: { id: b.id }, data: { reminderSentAt: new Date() } });
      } catch (e: any) {
        this.logger.error(`Échec rappel ${b.id}: ${e.message}`);
      }
    }
  }
}
