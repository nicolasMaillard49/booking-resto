import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceWindowsService } from './service-windows.service';

describe('ServiceWindowsService', () => {
  let service: ServiceWindowsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      serviceWindow: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ServiceWindowsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(ServiceWindowsService);
  });

  describe('findAll', () => {
    it('retourne windows triés par sortOrder asc puis createdAt asc', async () => {
      prisma.serviceWindow.findMany.mockResolvedValue([{ id: 'w1' }, { id: 'w2' }]);
      const r = await service.findAll();
      expect(r).toHaveLength(2);
      expect(prisma.serviceWindow.findMany).toHaveBeenCalledWith({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      });
    });
  });

  describe('findActiveForDay', () => {
    it('filtre où isActive=true et daysOfWeek contient le jour', async () => {
      prisma.serviceWindow.findMany.mockResolvedValue([]);
      await service.findActiveForDay(3);
      expect(prisma.serviceWindow.findMany).toHaveBeenCalledWith({
        where: { isActive: true, daysOfWeek: { has: 3 } },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('retourne [] si aucun match', async () => {
      prisma.serviceWindow.findMany.mockResolvedValue([]);
      expect(await service.findActiveForDay(7)).toEqual([]);
    });
  });

  describe('create', () => {
    it('lève BadRequestException si startTime >= endTime', async () => {
      await expect(service.create({
        label: 'X', daysOfWeek: [1], startTime: '14:00', endTime: '12:00',
      })).rejects.toThrow(BadRequestException);
    });

    it('lève BadRequestException si startTime === endTime', async () => {
      await expect(service.create({
        label: 'X', daysOfWeek: [1], startTime: '12:00', endTime: '12:00',
      })).rejects.toThrow(BadRequestException);
    });

    it('crée si valide, isActive par défaut true', async () => {
      prisma.serviceWindow.create.mockResolvedValue({ id: 'w1', isActive: true });
      await service.create({ label: 'Midi', daysOfWeek: [2,3,4,5,6], startTime: '12:00', endTime: '14:00' });
      expect(prisma.serviceWindow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isActive: true, label: 'Midi' }),
      });
    });

    it('respecte isActive=false fourni explicitement', async () => {
      prisma.serviceWindow.create.mockResolvedValue({ id: 'w1' });
      await service.create({ label: 'X', daysOfWeek: [1], startTime: '12:00', endTime: '14:00', isActive: false });
      expect(prisma.serviceWindow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isActive: false }),
      });
    });
  });

  describe('update', () => {
    it('valide les times si startTime ET endTime fournis', async () => {
      await expect(service.update('w1', { startTime: '14:00', endTime: '12:00' }))
        .rejects.toThrow(BadRequestException);
      expect(prisma.serviceWindow.update).not.toHaveBeenCalled();
    });

    it('skip validation si seulement startTime fourni', async () => {
      prisma.serviceWindow.update.mockResolvedValue({ id: 'w1' });
      await service.update('w1', { startTime: '13:00' });
      expect(prisma.serviceWindow.update).toHaveBeenCalled();
    });

    it('appelle prisma.update avec id et data', async () => {
      prisma.serviceWindow.update.mockResolvedValue({ id: 'w1' });
      await service.update('w1', { label: 'New' });
      expect(prisma.serviceWindow.update).toHaveBeenCalledWith({
        where: { id: 'w1' },
        data: { label: 'New' },
      });
    });

    it('propage l\'erreur Prisma (P2025 → 404 via filter global)', async () => {
      const err: any = new Error('P2025'); err.code = 'P2025';
      prisma.serviceWindow.update.mockRejectedValue(err);
      await expect(service.update('inexistant', { label: 'X' })).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('appelle prisma.delete avec le bon id', async () => {
      prisma.serviceWindow.delete.mockResolvedValue({ id: 'w1' });
      await service.remove('w1');
      expect(prisma.serviceWindow.delete).toHaveBeenCalledWith({ where: { id: 'w1' } });
    });

    it('propage l\'erreur Prisma', async () => {
      const err: any = new Error('P2025'); err.code = 'P2025';
      prisma.serviceWindow.delete.mockRejectedValue(err);
      await expect(service.remove('inexistant')).rejects.toThrow();
    });
  });

  describe('reorder', () => {
    it('assigne sortOrder=idx pour chaque id', async () => {
      prisma.serviceWindow.update.mockResolvedValue({});
      prisma.serviceWindow.findMany.mockResolvedValue([]);
      await service.reorder(['a', 'b', 'c']);
      expect(prisma.serviceWindow.update).toHaveBeenCalledTimes(3);
      expect(prisma.serviceWindow.update).toHaveBeenCalledWith({ where: { id: 'a' }, data: { sortOrder: 0 } });
      expect(prisma.serviceWindow.update).toHaveBeenCalledWith({ where: { id: 'b' }, data: { sortOrder: 1 } });
      expect(prisma.serviceWindow.update).toHaveBeenCalledWith({ where: { id: 'c' }, data: { sortOrder: 2 } });
    });

    it('renvoie findAll() après reorder', async () => {
      prisma.serviceWindow.update.mockResolvedValue({});
      prisma.serviceWindow.findMany.mockResolvedValue([{ id: 'a', sortOrder: 0 }]);
      const r = await service.reorder(['a']);
      expect(r).toEqual([{ id: 'a', sortOrder: 0 }]);
    });
  });
});
