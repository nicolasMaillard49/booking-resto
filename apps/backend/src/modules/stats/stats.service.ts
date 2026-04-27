import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

export interface OverviewResult {
  couvertsToday: number;
  bookingsToday: number;
  pendingCount: number;
  tauxRemplissageMidi: number;
  tauxRemplissageSoir: number;
  chart7d: Array<{ date: string; couverts: number }>;
}

export interface PeriodResult {
  total: number;
  count: number;
  from: string;
  to: string;
}

const ACTIVE_STATUSES: Prisma.BookingWhereInput['status'] = { in: ['CONFIRMED', 'PENDING'] };

function startOfDayUTC(d: Date): Date { const x = new Date(d); x.setUTCHours(0, 0, 0, 0); return x; }
function endOfDayUTC(d: Date): Date { const x = new Date(d); x.setUTCHours(23, 59, 59, 999); return x; }

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService, private settings: SettingsService) {}

  async overview(): Promise<OverviewResult> {
    const today = new Date();
    const dayStart = startOfDayUTC(today);
    const dayEnd = endOfDayUTC(today);

    const todayBookings = await this.prisma.booking.findMany({
      where: { date: { gte: dayStart, lte: dayEnd }, status: ACTIVE_STATUSES },
      include: { serviceWindow: { select: { label: true } } },
    });
    const couvertsToday = todayBookings.reduce((s, b) => s + b.partySize, 0);
    const pendingCount = todayBookings.filter(b => b.status === 'PENDING').length;

    const capacityMax = await this.settings.getCapacityMax();
    const midi = todayBookings
      .filter(b => b.serviceWindow?.label?.toLowerCase().includes('midi'))
      .reduce((s, b) => s + b.partySize, 0);
    const soir = todayBookings
      .filter(b => b.serviceWindow?.label?.toLowerCase().includes('soir'))
      .reduce((s, b) => s + b.partySize, 0);
    const tauxMidi = capacityMax > 0 ? Math.round((midi / capacityMax) * 100) : 0;
    const tauxSoir = capacityMax > 0 ? Math.round((soir / capacityMax) * 100) : 0;

    // Chart 7j : 1 seule requête raw groupée par jour (UTC), au lieu de 7× filter en mémoire
    const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 6);
    const grouped = await this.prisma.$queryRaw<Array<{ day: Date; couverts: bigint }>>`
      SELECT date_trunc('day', "date" AT TIME ZONE 'UTC')::date AS day,
             SUM("partySize")::bigint AS couverts
      FROM "bookings"
      WHERE "date" >= ${startOfDayUTC(sevenDaysAgo)}
        AND "date" <= ${dayEnd}
        AND "status" IN ('CONFIRMED', 'PENDING')
      GROUP BY day
      ORDER BY day ASC
    `;
    const couvertsByDay = new Map<string, number>();
    for (const row of grouped) {
      const key = new Date(row.day).toISOString().slice(0, 10);
      couvertsByDay.set(key, Number(row.couverts));
    }
    const chart7d: Array<{ date: string; couverts: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      chart7d.push({ date: key, couverts: couvertsByDay.get(key) ?? 0 });
    }

    return {
      couvertsToday,
      bookingsToday: todayBookings.length,
      pendingCount,
      tauxRemplissageMidi: tauxMidi,
      tauxRemplissageSoir: tauxSoir,
      chart7d,
    };
  }

  async byPeriod(from: string, to: string): Promise<PeriodResult> {
    const agg = await this.prisma.booking.aggregate({
      where: { date: { gte: new Date(from), lte: new Date(to) }, status: ACTIVE_STATUSES },
      _sum: { partySize: true },
      _count: { _all: true },
    });
    return {
      total: agg._sum.partySize ?? 0,
      count: agg._count._all,
      from,
      to,
    };
  }
}
