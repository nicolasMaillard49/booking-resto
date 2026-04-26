import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ServicesService', () => {
  let service: ServicesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      service: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(ServicesService);
  });

  describe('findAll (admin)', () => {
    it('returns all services (active + inactive)', async () => {
      const mock = [{ id: 's1' }, { id: 's2' }];
      prisma.service.findMany.mockResolvedValue(mock);

      const result = await service.findAll();

      expect(result).toEqual(mock);
      expect(prisma.service.findMany).toHaveBeenCalledWith({
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('findPublic', () => {
    it('returns only active services with the public projection', async () => {
      prisma.service.findMany.mockResolvedValue([{ id: 's1', name: 'Coupe' }]);

      const result = await service.findPublic();

      expect(result).toEqual([{ id: 's1', name: 'Coupe' }]);
      expect(prisma.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        }),
      );
    });
  });

  describe('create', () => {
    it('creates a service with defaults', async () => {
      prisma.service.create.mockResolvedValue({ id: 's1' });

      await service.create({ name: 'Barbe', duration: 30, price: 20 });

      const call = prisma.service.create.mock.calls[0][0];
      expect(call.data.sortOrder).toBe(0);
      expect(call.data.name).toBe('Barbe');
    });

    it('forwards provided sortOrder', async () => {
      prisma.service.create.mockResolvedValue({ id: 's1' });

      await service.create({
        name: 'Coupe',
        duration: 60,
        price: 55,
        sortOrder: 3,
      });

      const call = prisma.service.create.mock.calls[0][0];
      expect(call.data.sortOrder).toBe(3);
    });
  });

  describe('update', () => {
    it('updates an existing service', async () => {
      prisma.service.findUnique.mockResolvedValue({ id: 's1' });
      prisma.service.update.mockResolvedValue({ id: 's1', name: 'Nouveau nom' });

      const result = await service.update('s1', { name: 'Nouveau nom' });

      expect(result.name).toBe('Nouveau nom');
    });

    it('throws NotFoundException when service does not exist', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(service.update('s999', { name: 'X' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('soft-deletes by setting isActive to false', async () => {
      prisma.service.findUnique.mockResolvedValue({ id: 's1' });
      prisma.service.update.mockResolvedValue({ id: 's1', isActive: false });

      const result = await service.remove('s1');

      expect(result.isActive).toBe(false);
      expect(prisma.service.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { isActive: false },
      });
    });

    it('throws NotFoundException when service does not exist', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(service.remove('s999')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('reorder', () => {
    it('updates sortOrder in a transaction', async () => {
      prisma.service.update.mockImplementation(() => Promise.resolve({}));

      const dto = {
        items: [
          { id: 's1', sortOrder: 0 },
          { id: 's2', sortOrder: 1 },
        ],
      };

      const result = await service.reorder(dto);

      expect(result).toEqual({ success: true });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.service.update).toHaveBeenCalledTimes(2);
    });
  });
});
