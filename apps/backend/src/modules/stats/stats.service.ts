import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService, private settings: SettingsService) {}

  private startOfDayUTC(d: Date) { const x = new Date(d); x.setUTCHours(0,0,0,0); return x; }
  private endOfDayUTC(d: Date)   { const x = new Date(d); x.setUTCHours(23,59,59,999); return x; }

  async overview() {
    const today = new Date();
    const dayStart = this.startOfDayUTC(today);
    const dayEnd = this.endOfDayUTC(today);

    const todayBookings = await this.prisma.booking.findMany({
      where: { date: { gte: dayStart, lte: dayEnd }, status: { in: ['CONFIRMED', 'PENDING'] } },
      include: { serviceWindow: true },
    });
    const couvertsToday = todayBookings.reduce((s, b) => s + b.partySize, 0);
    const pendingCount = todayBookings.filter(b => b.status === 'PENDING').length;

    const capacityMax = await this.settings.getCapacityMax();
    const midi = todayBookings.filter(b => b.serviceWindow?.label?.toLowerCase().includes('midi')).reduce((s, b) => s + b.partySize, 0);
    const soir = todayBookings.filter(b => b.serviceWindow?.label?.toLowerCase().includes('soir')).reduce((s, b) => s + b.partySize, 0);
    const tauxMidi = capacityMax > 0 ? Math.round((midi / capacityMax) * 100) : 0;
    const tauxSoir = capacityMax > 0 ? Math.round((soir / capacityMax) * 100) : 0;

    const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 6);
    const weekBookings = await this.prisma.booking.findMany({
      where: { date: { gte: this.startOfDayUTC(sevenDaysAgo), lte: dayEnd }, status: { in: ['CONFIRMED', 'PENDING'] } },
      select: { date: true, partySize: true },
    });
    const chart7d: { date: string; couverts: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const dayKey = d.toISOString().slice(0, 10);
      const sum = weekBookings.filter(b => b.date.toISOString().slice(0, 10) === dayKey).reduce((s, b) => s + b.partySize, 0);
      chart7d.push({ date: dayKey, couverts: sum });
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

  async byPeriod(from: string, to: string) {
    const items = await this.prisma.booking.findMany({
      where: { date: { gte: new Date(from), lte: new Date(to) }, status: { in: ['CONFIRMED', 'PENDING'] } },
      select: { date: true, partySize: true },
    });
    const total = items.reduce((s, b) => s + b.partySize, 0);
    return { total, count: items.length, from, to };
  }
}
