import { Test } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('StatsService', () => {
  let service: StatsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      booking: {
        count: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn(),
      },
      service: {
        findMany: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(StatsService);
  });

  function setupDefaultMocks() {
    prisma.booking.count.mockResolvedValue(10);
    prisma.booking.findMany.mockImplementation((args: any) => {
      if (args.select?.clientEmail) {
        return Promise.resolve([
          { clientEmail: 'a@test.fr' },
          { clientEmail: 'b@test.fr' },
          { clientEmail: 'a@test.fr' },
        ]);
      }
      if (args.select?.date) {
        return Promise.resolve([
          { date: new Date('2026-04-10') },
          { date: new Date('2026-04-10') },
        ]);
      }
      return Promise.resolve([{ id: 'bk1' }]);
    });
    prisma.booking.groupBy.mockImplementation((args: any) => {
      if (args.by.includes('serviceId')) {
        return Promise.resolve([
          { serviceId: 'svc1', _count: { _all: 50 }, _sum: { amount: 2750 } },
        ]);
      }
      return Promise.resolve([{ date: new Date('2026-04-08'), _count: 4 }]);
    });
    prisma.booking.aggregate.mockResolvedValue({ _sum: { amount: 500 } });
    prisma.service.findMany.mockResolvedValue([{ id: 'svc1', name: 'Coupe femme' }]);
  }

  it('returns today / upcoming / weekly + analytics with default period "year"', async () => {
    setupDefaultMocks();

    const stats = await service.getStats();

    expect(stats.today).toEqual({ total: 10, confirmed: 10, revenue: 500 });
    expect(stats.analytics.period).toBe('year');
    expect(stats.analytics.label).toMatch(/^Année \d{4}$/);
    expect(stats.analytics.currentPeriod.bookings).toBe(10);
    expect(stats.analytics.currentPeriod.uniqueClients).toBe(2);
    expect(stats.analytics.topServices).toEqual([
      { serviceId: 'svc1', name: 'Coupe femme', count: 50, revenue: 2750 },
    ]);
    expect(stats.analytics.busiestDays).toHaveLength(3);
  });

  it.each(['12m', '90d', '30d', '7d'] as const)(
    'computes a shifted previousPeriod for %s',
    async (period) => {
      setupDefaultMocks();

      const stats = await service.getStats(period);

      const cur = stats.analytics.currentPeriod;
      const prev = stats.analytics.previousPeriod;
      expect(stats.analytics.period).toBe(period);
      expect(prev.to.getTime()).toBe(cur.from.getTime());
      const curDuration = cur.to.getTime() - cur.from.getTime();
      const prevDuration = prev.to.getTime() - prev.from.getTime();
      expect(prevDuration).toBe(curDuration);
    },
  );

  it('defaults revenue to 0 and topServices to [] when no data', async () => {
    prisma.booking.count.mockResolvedValue(0);
    prisma.booking.findMany.mockResolvedValue([]);
    prisma.booking.groupBy.mockResolvedValue([]);
    prisma.booking.aggregate.mockResolvedValue({ _sum: { amount: null } });
    prisma.service.findMany.mockResolvedValue([]);

    const stats = await service.getStats('30d');

    expect(stats.today.revenue).toBe(0);
    expect(stats.analytics.currentPeriod.revenue).toBe(0);
    expect(stats.analytics.topServices).toEqual([]);
  });
});
