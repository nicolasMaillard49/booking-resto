import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type StatsPeriod = 'year' | '12m' | '90d' | '30d' | '7d';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Stats du dashboard admin avec plage configurable pour les analyses. */
  async getStats(period: StatsPeriod = 'year') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalBookingsToday,
      confirmedBookingsToday,
      pendingBookings,
      upcomingBookings,
      weeklyBookings,
    ] = await Promise.all([
      this.prisma.booking.count({
        where: {
          date: { gte: today, lt: tomorrow },
          status: { notIn: ['CANCELLED'] },
        },
      }),
      this.prisma.booking.count({
        where: {
          date: { gte: today, lt: tomorrow },
          status: 'CONFIRMED',
        },
      }),
      this.prisma.booking.count({
        where: { status: 'PENDING' },
      }),
      this.prisma.booking.findMany({
        where: {
          date: { gte: new Date() },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        include: { service: true },
        orderBy: { date: 'asc' },
        take: 5,
      }),
      this.prisma.booking.groupBy({
        by: ['date'],
        where: {
          date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          status: { notIn: ['CANCELLED'] },
        },
        _count: true,
      }),
    ]);

    const revenueToday = await this.prisma.booking.aggregate({
      where: {
        date: { gte: today, lt: tomorrow },
        paymentStatus: 'PAID',
      },
      _sum: { amount: true },
    });

    const analytics = await this.getAnalytics(period);

    return {
      today: {
        total: totalBookingsToday,
        confirmed: confirmedBookingsToday,
        revenue: revenueToday._sum.amount ?? 0,
      },
      pending: pendingBookings,
      upcoming: upcomingBookings,
      weeklyStats: weeklyBookings.map((day) => ({
        date: day.date,
        count: day._count,
      })),
      analytics,
    };
  }

  /**
   * Stats analytiques sur une période + comparaison avec la période précédente
   * de même durée. + top jours de la semaine, top services.
   */
  private async getAnalytics(period: StatsPeriod) {
    const { currentFrom, currentTo, previousFrom, previousTo, label } =
      this.resolvePeriod(period);

    const [current, previous, byDow, byService] = await Promise.all([
      this.getPeriodSummary(currentFrom, currentTo),
      this.getPeriodSummary(previousFrom, previousTo),
      this.prisma.booking.findMany({
        where: {
          date: { gte: currentFrom, lt: currentTo },
          status: { notIn: ['CANCELLED'] },
        },
        select: { date: true },
      }),
      this.prisma.booking.groupBy({
        by: ['serviceId'],
        where: {
          date: { gte: currentFrom, lt: currentTo },
          status: { notIn: ['CANCELLED'] },
        },
        _count: { _all: true },
        _sum: { amount: true },
        orderBy: { _count: { serviceId: 'desc' } },
        take: 3,
      }),
    ]);

    // Jours de la semaine (0=lundi … 6=dimanche)
    const dowCount = [0, 0, 0, 0, 0, 0, 0];
    for (const b of byDow) {
      const jsDay = b.date.getDay();
      const dow = jsDay === 0 ? 6 : jsDay - 1;
      dowCount[dow]++;
    }
    const busiestDays = dowCount
      .map((count, dayOfWeek) => ({ dayOfWeek, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Résoudre les noms des top services
    const serviceIds = byService.map((s) => s.serviceId);
    const services = serviceIds.length
      ? await this.prisma.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, name: true },
        })
      : [];
    const serviceNameById = new Map(services.map((s) => [s.id, s.name]));
    const topServices = byService.map((s) => ({
      serviceId: s.serviceId,
      name: serviceNameById.get(s.serviceId) ?? 'Service supprimé',
      count: s._count._all,
      revenue: s._sum.amount ?? 0,
    }));

    return {
      period,
      label,
      currentPeriod: {
        from: currentFrom,
        to: currentTo,
        ...current,
      },
      previousPeriod: {
        from: previousFrom,
        to: previousTo,
        ...previous,
      },
      busiestDays,
      topServices,
    };
  }

  private resolvePeriod(period: StatsPeriod) {
    const now = new Date();
    let currentFrom: Date;
    let currentTo: Date;
    let label: string;

    switch (period) {
      case 'year': {
        currentFrom = new Date(now.getFullYear(), 0, 1);
        currentTo = new Date(now.getFullYear() + 1, 0, 1);
        label = `Année ${now.getFullYear()}`;
        break;
      }
      case '12m': {
        currentFrom = new Date(now);
        currentFrom.setMonth(currentFrom.getMonth() - 12);
        currentTo = now;
        label = '12 derniers mois';
        break;
      }
      case '90d': {
        currentFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        currentTo = now;
        label = '90 derniers jours';
        break;
      }
      case '30d': {
        currentFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        currentTo = now;
        label = '30 derniers jours';
        break;
      }
      case '7d': {
        currentFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        currentTo = now;
        label = '7 derniers jours';
        break;
      }
    }

    const durationMs = currentTo.getTime() - currentFrom.getTime();
    const previousTo = new Date(currentFrom);
    const previousFrom = new Date(currentFrom.getTime() - durationMs);

    return { currentFrom, currentTo, previousFrom, previousTo, label };
  }

  private async getPeriodSummary(from: Date, to: Date) {
    const [totalAgg, revenueAgg, bookings] = await Promise.all([
      this.prisma.booking.count({
        where: { date: { gte: from, lt: to }, status: { notIn: ['CANCELLED'] } },
      }),
      this.prisma.booking.aggregate({
        where: {
          date: { gte: from, lt: to },
          paymentStatus: 'PAID',
        },
        _sum: { amount: true },
      }),
      this.prisma.booking.findMany({
        where: { date: { gte: from, lt: to }, status: { notIn: ['CANCELLED'] } },
        select: { clientEmail: true },
      }),
    ]);

    const uniqueClients = new Set(
      bookings.map((b) => b.clientEmail.toLowerCase()),
    ).size;

    return {
      bookings: totalAgg,
      revenue: revenueAgg._sum.amount ?? 0,
      uniqueClients,
    };
  }
}
