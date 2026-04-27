import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScheduleExceptionsService } from './schedule-exceptions.service';

describe('ScheduleExceptionsService', () => {
  let service: ScheduleExceptionsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      scheduleException: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ScheduleExceptionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(ScheduleExceptionsService);
  });

  describe('findAll', () => {
    it('retourne les exceptions triées par startDate asc', async () => {
      prisma.scheduleException.findMany.mockResolvedValue([{ id: 'e1' }, { id: 'e2' }]);
      const r = await service.findAll();
      expect(r).toHaveLength(2);
      expect(prisma.scheduleException.findMany).toHaveBeenCalledWith({
        orderBy: { startDate: 'asc' },
      });
    });
  });

  describe('create', () => {
    it('lève BadRequestException si endDate < startDate', async () => {
      await expect(service.create({ startDate: '2026-05-10', endDate: '2026-05-01' }))
        .rejects.toThrow(BadRequestException);
      expect(prisma.scheduleException.create).not.toHaveBeenCalled();
    });

    it('accepte endDate = startDate (fermeture 1 jour)', async () => {
      prisma.scheduleException.create.mockResolvedValue({ id: 'e1' });
      await expect(service.create({ startDate: '2026-05-10', endDate: '2026-05-10' }))
        .resolves.toBeDefined();
    });

    it('persiste reason si fournie', async () => {
      prisma.scheduleException.create.mockResolvedValue({ id: 'e1' });
      await service.create({ startDate: '2026-05-01', endDate: '2026-05-09', reason: 'Vacances' });
      expect(prisma.scheduleException.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ reason: 'Vacances' }),
      });
    });

    it('persiste reason=null si non fournie', async () => {
      prisma.scheduleException.create.mockResolvedValue({ id: 'e1' });
      await service.create({ startDate: '2026-05-01', endDate: '2026-05-02' });
      expect(prisma.scheduleException.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ reason: null }),
      });
    });

    it('convertit les strings en Date pour Prisma', async () => {
      prisma.scheduleException.create.mockResolvedValue({ id: 'e1' });
      await service.create({ startDate: '2026-05-01', endDate: '2026-05-09' });
      const call = prisma.scheduleException.create.mock.calls[0][0];
      expect(call.data.startDate).toBeInstanceOf(Date);
      expect(call.data.endDate).toBeInstanceOf(Date);
    });
  });

  describe('isDateBlocked', () => {
    it('retourne true si une exception couvre exactement la date', async () => {
      prisma.scheduleException.findFirst.mockResolvedValue({ id: 'e1' });
      expect(await service.isDateBlocked(new Date('2026-05-05'))).toBe(true);
    });

    it('retourne false si aucune exception trouvée', async () => {
      prisma.scheduleException.findFirst.mockResolvedValue(null);
      expect(await service.isDateBlocked(new Date('2026-05-05'))).toBe(false);
    });

    it('normalise la date à 00:00:00 UTC avant la requête', async () => {
      prisma.scheduleException.findFirst.mockResolvedValue(null);
      await service.isDateBlocked(new Date('2026-05-05T18:30:00Z'));
      const call = prisma.scheduleException.findFirst.mock.calls[0][0];
      expect(call.where.startDate.lte).toBeInstanceOf(Date);
      expect((call.where.startDate.lte as Date).getUTCHours()).toBe(0);
      expect((call.where.startDate.lte as Date).getUTCMinutes()).toBe(0);
    });

    it('passe la date dans where.startDate.lte ET where.endDate.gte', async () => {
      prisma.scheduleException.findFirst.mockResolvedValue(null);
      await service.isDateBlocked(new Date('2026-05-05'));
      const call = prisma.scheduleException.findFirst.mock.calls[0][0];
      expect(call.where).toHaveProperty('startDate.lte');
      expect(call.where).toHaveProperty('endDate.gte');
    });
  });

  describe('remove', () => {
    it('appelle prisma.delete avec le bon id', async () => {
      prisma.scheduleException.delete.mockResolvedValue({ id: 'e1' });
      await service.remove('e1');
      expect(prisma.scheduleException.delete).toHaveBeenCalledWith({ where: { id: 'e1' } });
    });

    it('propage l\'erreur Prisma (gérée par PrismaExceptionFilter)', async () => {
      const err = new Error('P2025');
      (err as any).code = 'P2025';
      prisma.scheduleException.delete.mockRejectedValue(err);
      await expect(service.remove('inexistant')).rejects.toThrow();
    });
  });
});
