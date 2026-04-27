import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { ServiceWindowsService } from '../service-windows/service-windows.service';
import { ScheduleExceptionsService } from '../schedule-exceptions/schedule-exceptions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: any;
  let settings: any;
  let windows: any;
  let exceptions: any;
  let notifications: any;

  beforeEach(async () => {
    prisma = {
      booking: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
    };
    settings = {
      getCapacityMax: jest.fn().mockResolvedValue(30),
      getDefaultMealDurationMin: jest.fn().mockResolvedValue(90),
      getAutoConfirmThreshold: jest.fn().mockResolvedValue(6),
      getLookaheadDays: jest.fn().mockResolvedValue(90),
      getCutoffHours: jest.fn().mockResolvedValue(2),
      getSlotIntervalMin: jest.fn().mockResolvedValue(15),
    };
    windows = { findActiveForDay: jest.fn().mockResolvedValue([]) };
    exceptions = { isDateBlocked: jest.fn().mockResolvedValue(false) };
    notifications = {
      onBookingCreated: jest.fn(),
      onBookingCancelled: jest.fn(),
      onBookingConfirmedByAdmin: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: SettingsService, useValue: settings },
        { provide: ServiceWindowsService, useValue: windows },
        { provide: ScheduleExceptionsService, useValue: exceptions },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();
    service = moduleRef.get(BookingsService);
  });

  // ────────────────────────────── generateSlots
  describe('generateSlots', () => {
    function tomorrow() {
      const d = new Date(); d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    }
    function inDays(n: number) {
      const d = new Date(); d.setDate(d.getDate() + n);
      return d.toISOString().slice(0, 10);
    }

    it('renvoie [] si date antérieure à aujourd\'hui', async () => {
      expect(await service.generateSlots(inDays(-1), 2)).toEqual([]);
    });

    it('renvoie [] si date au-delà du lookahead', async () => {
      expect(await service.generateSlots(inDays(200), 2)).toEqual([]);
    });

    it('renvoie [] si une exception couvre la date', async () => {
      exceptions.isDateBlocked.mockResolvedValue(true);
      expect(await service.generateSlots(tomorrow(), 2)).toEqual([]);
    });

    it('renvoie [] si aucune ServiceWindow active ce jour', async () => {
      windows.findActiveForDay.mockResolvedValue([]);
      expect(await service.generateSlots(tomorrow(), 2)).toEqual([]);
    });

    it('génère slots aux intervalles entre startTime et endTime inclus', async () => {
      windows.findActiveForDay.mockResolvedValue([
        { id: 'w1', label: 'Midi', startTime: '12:00', endTime: '13:00', daysOfWeek: [1,2,3,4,5,6,7] },
      ]);
      const slots = await service.generateSlots(tomorrow(), 2);
      expect(slots.map(s => s.time)).toEqual(['12:00', '12:15', '12:30', '12:45', '13:00']);
      expect(slots.every(s => s.serviceWindowId === 'w1')).toBe(true);
      expect(slots.every(s => s.serviceWindowLabel === 'Midi')).toBe(true);
    });

    it('exclut les slots où Σ partySize + N dépasserait capacity', async () => {
      const tw = tomorrow();
      windows.findActiveForDay.mockResolvedValue([
        { id: 'w1', label: 'Midi', startTime: '12:00', endTime: '12:30', daysOfWeek: [1,2,3,4,5,6,7] },
      ]);
      settings.getCapacityMax.mockResolvedValue(10);
      const bDate = new Date(`${tw}T12:00:00.000Z`);
      prisma.booking.findMany.mockResolvedValue([{ date: bDate, partySize: 8 }]);
      // 8 + 4 = 12 > 10 → tous les slots qui chevauchent sont exclus
      expect(await service.generateSlots(tw, 4)).toEqual([]);
    });

    it('inclut les slots qui ne chevauchent aucun booking existant', async () => {
      const tw = tomorrow();
      windows.findActiveForDay.mockResolvedValue([
        { id: 'w1', label: 'Soir', startTime: '19:00', endTime: '19:15', daysOfWeek: [1,2,3,4,5,6,7] },
      ]);
      settings.getCapacityMax.mockResolvedValue(10);
      // booking à 12:00 (midi), durée 90 min → finit à 13:30, ne chevauche pas 19:00
      prisma.booking.findMany.mockResolvedValue([
        { date: new Date(`${tw}T12:00:00.000Z`), partySize: 100 },
      ]);
      expect(await service.generateSlots(tw, 2)).toHaveLength(2);
    });

    it('drop slots avant cutoff si date = aujourd\'hui', async () => {
      const today = new Date().toISOString().slice(0, 10);
      windows.findActiveForDay.mockResolvedValue([
        { id: 'w1', label: 'Soir', startTime: '00:00', endTime: '23:45', daysOfWeek: [1,2,3,4,5,6,7] },
      ]);
      settings.getCutoffHours.mockResolvedValue(2);
      const slots = await service.generateSlots(today, 2);
      const cutoffMs = Date.now() + 2 * 3600 * 1000;
      for (const s of slots) {
        const slotMs = new Date(`${today}T${s.time}:00.000Z`).getTime();
        expect(slotMs).toBeGreaterThanOrEqual(cutoffMs);
      }
    });

    it('renvoie un slot par window×interval (deux windows)', async () => {
      windows.findActiveForDay.mockResolvedValue([
        { id: 'w1', label: 'Midi', startTime: '12:00', endTime: '12:00', daysOfWeek: [1,2,3,4,5,6,7] },
        { id: 'w2', label: 'Soir', startTime: '19:00', endTime: '19:00', daysOfWeek: [1,2,3,4,5,6,7] },
      ]);
      const slots = await service.generateSlots(tomorrow(), 2);
      expect(slots.map(s => s.serviceWindowLabel)).toEqual(['Midi', 'Soir']);
    });
  });

  // ────────────────────────────── create
  describe('create', () => {
    function tomorrow() {
      const d = new Date(); d.setDate(d.getDate() + 1); d.setUTCHours(12, 30, 0, 0);
      return d;
    }

    it('rejette BadRequest si le créneau demandé n\'est pas dans les slots dispos', async () => {
      windows.findActiveForDay.mockResolvedValue([
        { id: 'w1', label: 'Midi', startTime: '12:00', endTime: '14:00', daysOfWeek: [1,2,3,4,5,6,7] },
      ]);
      const dt = tomorrow().toISOString().replace('12:30', '15:30'); // hors window
      await expect(service.create({
        partySize: 2, date: dt,
        clientName: 'A', clientEmail: 'a@b.fr', clientPhone: '0600000000',
      })).rejects.toThrow(BadRequestException);
    });

    it('CONFIRMED auto si partySize <= threshold', async () => {
      const t = tomorrow();
      settings.getAutoConfirmThreshold.mockResolvedValue(6);
      windows.findActiveForDay.mockResolvedValue([
        { id: 'w1', label: 'Midi', startTime: '12:00', endTime: '14:00', daysOfWeek: [1,2,3,4,5,6,7] },
      ]);
      prisma.booking.create.mockResolvedValue({ id: 'b1', status: 'CONFIRMED', serviceWindow: null });
      const r = await service.create({
        partySize: 4, date: t.toISOString(),
        clientName: 'Alice', clientEmail: 'a@b.fr', clientPhone: '0600000000',
      });
      expect(r.status).toBe('CONFIRMED');
      expect(prisma.booking.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'CONFIRMED', partySize: 4 }),
      }));
      expect(notifications.onBookingCreated).toHaveBeenCalledWith(r);
    });

    it('PENDING si partySize > threshold', async () => {
      const t = tomorrow();
      settings.getAutoConfirmThreshold.mockResolvedValue(6);
      windows.findActiveForDay.mockResolvedValue([
        { id: 'w1', label: 'Midi', startTime: '12:00', endTime: '14:00', daysOfWeek: [1,2,3,4,5,6,7] },
      ]);
      prisma.booking.create.mockResolvedValue({ id: 'b2', status: 'PENDING', serviceWindow: null });
      const r = await service.create({
        partySize: 12, date: t.toISOString(),
        clientName: 'Bob', clientEmail: 'b@c.fr', clientPhone: '0600000000',
      });
      expect(r.status).toBe('PENDING');
    });

    it('utilise une transaction Serializable et lève ConflictException si capacité dépassée à la dernière seconde', async () => {
      const t = tomorrow();
      windows.findActiveForDay.mockResolvedValue([
        { id: 'w1', label: 'Midi', startTime: '12:00', endTime: '14:00', daysOfWeek: [1,2,3,4,5,6,7] },
      ]);
      settings.getCapacityMax.mockResolvedValue(10);

      // 1er findMany (pré-check generateSlots) : 0 booking → slot dispo
      // 2e findMany (sumOccupiedAt dans transaction) : un booking est arrivé entre-temps
      prisma.booking.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ date: t, partySize: 9 }]);

      await expect(service.create({
        partySize: 4, date: t.toISOString(),
        clientName: 'Race', clientEmail: 'r@r.fr', clientPhone: '0600000000',
      })).rejects.toThrow(ConflictException);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('passe l\'isolationLevel Serializable à $transaction', async () => {
      const t = tomorrow();
      windows.findActiveForDay.mockResolvedValue([
        { id: 'w1', label: 'Midi', startTime: '12:00', endTime: '14:00', daysOfWeek: [1,2,3,4,5,6,7] },
      ]);
      prisma.booking.create.mockResolvedValue({ id: 'b1', status: 'CONFIRMED', serviceWindow: null });
      await service.create({
        partySize: 2, date: t.toISOString(),
        clientName: 'X', clientEmail: 'x@x.fr', clientPhone: '0600000000',
      });
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ isolationLevel: Prisma.TransactionIsolationLevel.Serializable }),
      );
    });
  });

  // ────────────────────────────── cancelByToken
  describe('cancelByToken', () => {
    it('lève NotFoundException si token introuvable', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);
      await expect(service.cancelByToken('bad')).rejects.toThrow(NotFoundException);
    });

    it('lève BadRequestException si déjà CANCELLED', async () => {
      prisma.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'CANCELLED', cancelToken: 'tok' });
      await expect(service.cancelByToken('tok')).rejects.toThrow(BadRequestException);
    });

    it('lève BadRequestException si COMPLETED', async () => {
      prisma.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'COMPLETED', cancelToken: 'tok' });
      await expect(service.cancelByToken('tok')).rejects.toThrow(BadRequestException);
    });

    it('passe le booking en CANCELLED + set cancelledAt + notifie', async () => {
      prisma.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'CONFIRMED', cancelToken: 'tok' });
      const updated = { id: 'b1', status: 'CANCELLED', cancelledAt: new Date() };
      prisma.booking.update.mockResolvedValue(updated);
      const r = await service.cancelByToken('tok');
      expect(r.status).toBe('CANCELLED');
      expect(prisma.booking.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'CANCELLED' }),
      }));
      expect(notifications.onBookingCancelled).toHaveBeenCalledWith(updated, 'client');
    });
  });

  // ────────────────────────────── confirmByToken
  describe('confirmByToken', () => {
    it('lève NotFoundException si token introuvable', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);
      await expect(service.confirmByToken('bad')).rejects.toThrow(NotFoundException);
    });

    it('lève BadRequestException si CANCELLED', async () => {
      prisma.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'CANCELLED', confirmToken: 'tok' });
      await expect(service.confirmByToken('tok')).rejects.toThrow(BadRequestException);
    });

    it('renvoie le booking sans changement si déjà CONFIRMED', async () => {
      const existing = { id: 'b1', status: 'CONFIRMED', confirmToken: 'tok' };
      prisma.booking.findUnique.mockResolvedValue(existing);
      const r = await service.confirmByToken('tok');
      expect(r).toBe(existing);
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('passe en CONFIRMED + set confirmedAt', async () => {
      prisma.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'PENDING', confirmToken: 'tok' });
      prisma.booking.update.mockResolvedValue({ id: 'b1', status: 'CONFIRMED' });
      const r = await service.confirmByToken('tok');
      expect(r.status).toBe('CONFIRMED');
    });
  });

  // ────────────────────────────── findAll
  describe('findAll', () => {
    it('retourne items + total + page + pageSize', async () => {
      prisma.booking.findMany.mockResolvedValueOnce([{ id: 'b1' }]);
      prisma.booking.count.mockResolvedValueOnce(1);
      const r = await service.findAll({});
      expect(r.items).toHaveLength(1);
      expect(r.total).toBe(1);
      expect(r.page).toBe(1);
      expect(r.pageSize).toBe(20);
    });

    it('filtre par status', async () => {
      prisma.booking.findMany.mockResolvedValueOnce([]);
      await service.findAll({ status: 'PENDING' });
      expect(prisma.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ status: 'PENDING' }),
      }));
    });

    it('cap pageSize à 100', async () => {
      prisma.booking.findMany.mockResolvedValueOnce([]);
      const r = await service.findAll({ pageSize: 500 });
      expect(r.pageSize).toBe(100);
    });

    it('recherche case-insensitive sur nom/email', async () => {
      prisma.booking.findMany.mockResolvedValueOnce([]);
      await service.findAll({ search: 'alice' });
      const call = prisma.booking.findMany.mock.calls[0][0];
      expect(call.where.OR).toBeDefined();
    });
  });

  // ────────────────────────────── update
  describe('update', () => {
    it('appelle onBookingConfirmedByAdmin si status CONFIRMED', async () => {
      const updated = { id: 'b1', status: 'CONFIRMED' };
      prisma.booking.update.mockResolvedValue(updated);
      await service.update('b1', { status: 'CONFIRMED' });
      expect(notifications.onBookingConfirmedByAdmin).toHaveBeenCalledWith(updated);
    });

    it('appelle onBookingCancelled "admin" si status CANCELLED', async () => {
      const updated = { id: 'b1', status: 'CANCELLED' };
      prisma.booking.update.mockResolvedValue(updated);
      await service.update('b1', { status: 'CANCELLED' });
      expect(notifications.onBookingCancelled).toHaveBeenCalledWith(updated, 'admin');
    });

    it('met à jour partySize, date, notes sans toucher status', async () => {
      prisma.booking.update.mockResolvedValue({});
      await service.update('b1', { partySize: 4, notes: 'x' });
      expect(prisma.booking.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ partySize: 4, notes: 'x' }),
      }));
    });
  });

  // ────────────────────────────── agenda
  describe('agenda', () => {
    it('regroupe par jour ISO', async () => {
      prisma.booking.findMany.mockResolvedValue([
        { id: 'b1', date: new Date('2026-05-10T12:00:00Z') },
        { id: 'b2', date: new Date('2026-05-10T19:00:00Z') },
        { id: 'b3', date: new Date('2026-05-11T12:00:00Z') },
      ]);
      const r = await service.agenda('2026-05-10', '2026-05-11');
      expect(Object.keys(r)).toEqual(['2026-05-10', '2026-05-11']);
      expect(r['2026-05-10']).toHaveLength(2);
      expect(r['2026-05-11']).toHaveLength(1);
    });

    it('renvoie {} si aucun booking', async () => {
      prisma.booking.findMany.mockResolvedValue([]);
      expect(await service.agenda('2026-05-10', '2026-05-11')).toEqual({});
    });
  });
});
