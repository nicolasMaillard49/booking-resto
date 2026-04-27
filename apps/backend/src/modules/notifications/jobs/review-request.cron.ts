import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class ReviewRequestCron {
  private readonly logger = new Logger(ReviewRequestCron.name);

  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  /**
   * Toutes les 15 minutes : envoie un email de demande d'avis Google
   * aux clients dont la réservation a eu lieu il y a 3h+, qui n'ont pas
   * encore reçu de demande, et qui n'ont pas annulé.
   */
  @Cron(CronExpression.EVERY_30_MINUTES, { timeZone: 'Europe/Paris' })
  async run() {
    const now = new Date();
    const threshold = new Date(now.getTime() - 3 * 3600 * 1000);    // résa il y a 3h+
    const lowerBound = new Date(now.getTime() - 24 * 3600 * 1000);  // pas plus vieux que 24h (évite spammer l'historique)

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        date: { lte: threshold, gte: lowerBound },
        reviewRequestSentAt: null,
      },
      include: { serviceWindow: true },
    });

    if (!bookings.length) return;
    this.logger.log(`Cron review-request : ${bookings.length} email(s) à envoyer`);

    for (const b of bookings) {
      try {
        await this.notifications.onBookingReviewRequest(b);
        await this.prisma.booking.update({
          where: { id: b.id },
          data: { reviewRequestSentAt: new Date() },
        });
      } catch (e: any) {
        this.logger.error(`Échec review-request ${b.id}: ${e.message}`);
      }
    }
  }
}
