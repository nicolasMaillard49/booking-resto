import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { StatsService } from './stats.service';

describe('StatsService', () => {
  let service: StatsService;
  let prisma: any;
  let settings: any;

  beforeEach(async () => {
    prisma = {
      booking: {
        findMany: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({ _sum: { partySize: 0 }, _count: { _all: 0 } }),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    settings = {
      getCapacityMax: jest.fn().mockResolvedValue(30),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: PrismaService, useValue: prisma },
        { provide: SettingsService, useValue: settings },
      ],
    }).compile();
    service = moduleRef.get(StatsService);
  });

  describe('overview', () => {
    it('renvoie 0 partout si aucune réservation', async () => {
      const r = await service.overview();
      expect(r.couvertsToday).toBe(0);
      expect(r.bookingsToday).toBe(0);
      expect(r.pendingCount).toBe(0);
      expect(r.tauxRemplissageMidi).toBe(0);
      expect(r.tauxRemplissageSoir).toBe(0);
      expect(r.chart7d).toHaveLength(7);
    });

    it('somme partySize pour couvertsToday', async () => {
      prisma.booking.findMany.mockResolvedValue([
        { partySize: 4, status: 'CONFIRMED', serviceWindow: { label: 'Service Midi' } },
        { partySize: 2, status: 'CONFIRMED', serviceWindow: { label: 'Service Midi' } },
      ]);
      const r = await service.overview();
      expect(r.couvertsToday).toBe(6);
      expect(r.bookingsToday).toBe(2);
    });

    it('compte les PENDING séparément', async () => {
      prisma.booking.findMany.mockResolvedValue([
        { partySize: 2, status: 'CONFIRMED', serviceWindow: null },
        { partySize: 12, status: 'PENDING', serviceWindow: null },
      ]);
      const r = await service.overview();
      expect(r.pendingCount).toBe(1);
    });

    it('calcule taux midi = midi / capacity * 100', async () => {
      prisma.booking.findMany.mockResolvedValue([
        { partySize: 6, status: 'CONFIRMED', serviceWindow: { label: 'Service Midi' } },
      ]);
      settings.getCapacityMax.mockResolvedValue(30);
      const r = await service.overview();
      expect(r.tauxRemplissageMidi).toBe(20); // 6/30 = 20%
    });

    it('calcule taux soir séparément', async () => {
      prisma.booking.findMany.mockResolvedValue([
        { partySize: 9, status: 'CONFIRMED', serviceWindow: { label: 'Service Soir' } },
      ]);
      settings.getCapacityMax.mockResolvedValue(30);
      const r = await service.overview();
      expect(r.tauxRemplissageMidi).toBe(0);
      expect(r.tauxRemplissageSoir).toBe(30);
    });

    it('taux=0 si capacityMax=0 (évite division par 0)', async () => {
      prisma.booking.findMany.mockResolvedValue([
        { partySize: 5, status: 'CONFIRMED', serviceWindow: { label: 'Midi' } },
      ]);
      settings.getCapacityMax.mockResolvedValue(0);
      const r = await service.overview();
      expect(r.tauxRemplissageMidi).toBe(0);
    });

    it('chart7d a exactement 7 entrées (J-6 à J)', async () => {
      const r = await service.overview();
      expect(r.chart7d).toHaveLength(7);
      // Dernier élément = aujourd'hui
      const today = new Date().toISOString().slice(0, 10);
      expect(r.chart7d[6].date).toBe(today);
    });

    it('chart7d remplit avec 0 les jours sans booking', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      const r = await service.overview();
      expect(r.chart7d.every(d => d.couverts === 0)).toBe(true);
    });

    it('chart7d intègre les couverts par jour depuis $queryRaw', async () => {
      const today = new Date(); today.setUTCHours(0, 0, 0, 0);
      prisma.$queryRaw.mockResolvedValue([
        { day: today, couverts: BigInt(15) },
      ]);
      const r = await service.overview();
      const todayKey = new Date().toISOString().slice(0, 10);
      const todayEntry = r.chart7d.find(d => d.date === todayKey);
      expect(todayEntry?.couverts).toBe(15);
    });
  });

  describe('byPeriod', () => {
    it('renvoie total + count + bornes', async () => {
      prisma.booking.aggregate.mockResolvedValue({
        _sum: { partySize: 42 },
        _count: { _all: 5 },
      });
      const r = await service.byPeriod('2026-04-01', '2026-04-30');
      expect(r.total).toBe(42);
      expect(r.count).toBe(5);
      expect(r.from).toBe('2026-04-01');
      expect(r.to).toBe('2026-04-30');
    });

    it('total=0 si aucune résa', async () => {
      prisma.booking.aggregate.mockResolvedValue({
        _sum: { partySize: null },
        _count: { _all: 0 },
      });
      const r = await service.byPeriod('2026-04-01', '2026-04-30');
      expect(r.total).toBe(0);
      expect(r.count).toBe(0);
    });

    it('filtre status CONFIRMED+PENDING uniquement', async () => {
      await service.byPeriod('2026-04-01', '2026-04-30');
      expect(prisma.booking.aggregate).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['CONFIRMED', 'PENDING'] },
        }),
      }));
    });
  });
});
