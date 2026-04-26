import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      availability: { findMany: jest.fn(), upsert: jest.fn() },
      blockedSlot: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(AvailabilityService);
  });

  describe('getSchedule', () => {
    it('returns availability ordered by dayOfWeek', async () => {
      prisma.availability.findMany.mockResolvedValue([{ dayOfWeek: 0 }]);

      const result = await service.getSchedule();

      expect(result).toEqual([{ dayOfWeek: 0 }]);
      expect(prisma.availability.findMany).toHaveBeenCalledWith({
        orderBy: { dayOfWeek: 'asc' },
      });
    });
  });

  describe('updateSchedule', () => {
    it('upserts every day in a single transaction', async () => {
      prisma.availability.upsert.mockImplementation((args: unknown) => Promise.resolve(args));

      const dto = {
        schedule: [
          { dayOfWeek: 0, startTime: '09:00', endTime: '18:00', isActive: true },
          { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isActive: true },
        ],
      };

      await expect(service.updateSchedule(dto)).resolves.toEqual({ success: true });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.availability.upsert).toHaveBeenCalledTimes(2);
      const firstCall = prisma.availability.upsert.mock.calls[0][0];
      expect(firstCall.where.dayOfWeek).toBe(0);
    });
  });

  describe('blockSlot', () => {
    it('creates a blocked slot', async () => {
      prisma.blockedSlot.create.mockResolvedValue({ id: 'bs1' });

      const dto = {
        date: '2026-05-01',
        startTime: '00:00',
        endTime: '23:59',
        reason: 'Férié',
      };

      const result = await service.blockSlot(dto);

      expect(result).toEqual({ id: 'bs1' });
      expect(prisma.blockedSlot.create).toHaveBeenCalledWith({
        data: {
          date: new Date('2026-05-01'),
          startTime: '00:00',
          endTime: '23:59',
          reason: 'Férié',
        },
      });
    });
  });

  describe('unblockSlot', () => {
    it('throws NotFoundException when slot does not exist', async () => {
      prisma.blockedSlot.findUnique.mockResolvedValue(null);

      await expect(service.unblockSlot('bs1')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.blockedSlot.delete).not.toHaveBeenCalled();
    });

    it('deletes the slot when it exists', async () => {
      prisma.blockedSlot.findUnique.mockResolvedValue({ id: 'bs1' });
      prisma.blockedSlot.delete.mockResolvedValue({});

      await expect(service.unblockSlot('bs1')).resolves.toEqual({ success: true });
      expect(prisma.blockedSlot.delete).toHaveBeenCalledWith({ where: { id: 'bs1' } });
    });
  });

  describe('getBlockedSlots', () => {
    it('returns future slots', async () => {
      prisma.blockedSlot.findMany.mockResolvedValue([{ id: 'bs1' }]);

      const result = await service.getBlockedSlots();

      expect(result).toEqual([{ id: 'bs1' }]);
      const args = prisma.blockedSlot.findMany.mock.calls[0][0];
      expect(args.where.date.gte).toBeInstanceOf(Date);
      expect(args.orderBy).toEqual({ date: 'asc' });
    });
  });
});
