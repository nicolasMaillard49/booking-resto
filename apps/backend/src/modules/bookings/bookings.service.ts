import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Booking, BookingStatus, Prisma, ServiceWindow } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { ServiceWindowsService } from '../service-windows/service-windows.service';
import { ScheduleExceptionsService } from '../schedule-exceptions/schedule-exceptions.service';
import { NotificationsService } from '../notifications/notifications.service';

const MS_PER_MIN = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

export interface AvailableSlot {
  time: string;                 // "HH:mm"
  serviceWindowId: string;
  serviceWindowLabel: string;
  date: string;                 // YYYY-MM-DD
}

export type BookingWithWindow = Booking & { serviceWindow: ServiceWindow | null };

export interface CreateBookingInput {
  partySize: number;
  date: string;                 // ISO datetime
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes?: string;
}

export interface UpdateBookingInput {
  partySize?: number;
  date?: string;
  status?: BookingStatus;
  notes?: string;
}

export interface FindBookingsFilter {
  from?: string;
  to?: string;
  status?: BookingStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

function isoDayOfWeek(d: Date): number {
  const js = d.getUTCDay();
  return js === 0 ? 7 : js;
}

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
    private windows: ServiceWindowsService,
    private exceptions: ScheduleExceptionsService,
    private notifications: NotificationsService,
  ) {}

  /** Combien de couverts sont déjà occupés à un instant donné (par overlap d'une durée standard). */
  private async sumOccupiedAt(slotStart: Date, slotEnd: Date, tx: Prisma.TransactionClient | PrismaService = this.prisma): Promise<number> {
    const dayStart = new Date(slotStart); dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(slotStart); dayEnd.setUTCHours(23, 59, 59, 999);
    const durationMin = await this.settings.getDefaultMealDurationMin();
    const bookings = await tx.booking.findMany({
      where: { date: { gte: dayStart, lte: dayEnd }, status: { in: ['PENDING', 'CONFIRMED'] } },
    });
    let occupied = 0;
    for (const b of bookings) {
      const bStart = b.date.getTime();
      const bEnd = bStart + durationMin * MS_PER_MIN;
      if (bStart < slotEnd.getTime() && bEnd > slotStart.getTime()) occupied += b.partySize;
    }
    return occupied;
  }

  async generateSlots(dateISO: string, partySize: number): Promise<AvailableSlot[]> {
    const lookaheadDays = await this.settings.getLookaheadDays();
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const target = new Date(dateISO); target.setUTCHours(0, 0, 0, 0);
    const diffDays = Math.floor((target.getTime() - today.getTime()) / MS_PER_DAY);
    if (diffDays < 0 || diffDays > lookaheadDays) return [];

    if (await this.exceptions.isDateBlocked(target)) return [];

    const dayOfWeek = isoDayOfWeek(target);
    const activeWindows = await this.windows.findActiveForDay(dayOfWeek);
    if (activeWindows.length === 0) return [];

    const intervalMin = await this.settings.getSlotIntervalMin();
    const durationMin = await this.settings.getDefaultMealDurationMin();
    const capacityMax = await this.settings.getCapacityMax();
    const cutoffMs = Date.now() + (await this.settings.getCutoffHours()) * MS_PER_HOUR;
    const isToday = diffDays === 0;

    const dayStart = new Date(target);
    const dayEnd = new Date(target); dayEnd.setUTCHours(23, 59, 59, 999);
    const bookings = await this.prisma.booking.findMany({
      where: { date: { gte: dayStart, lte: dayEnd }, status: { in: ['PENDING', 'CONFIRMED'] } },
    });

    const slots: AvailableSlot[] = [];
    for (const w of activeWindows) {
      const [sh, sm] = w.startTime.split(':').map(Number);
      const [eh, em] = w.endTime.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      for (let m = startMin; m <= endMin; m += intervalMin) {
        const hh = Math.floor(m / 60).toString().padStart(2, '0');
        const mm = (m % 60).toString().padStart(2, '0');
        const slotISO = `${dateISO}T${hh}:${mm}:00.000Z`;
        const slotStart = new Date(slotISO).getTime();
        const slotEnd = slotStart + durationMin * MS_PER_MIN;

        if (isToday && slotStart < cutoffMs) continue;

        let occupied = 0;
        for (const b of bookings) {
          const bStart = b.date.getTime();
          const bEnd = bStart + durationMin * MS_PER_MIN;
          if (bStart < slotEnd && bEnd > slotStart) occupied += b.partySize;
        }
        if (occupied + partySize > capacityMax) continue;

        slots.push({ time: `${hh}:${mm}`, serviceWindowId: w.id, serviceWindowLabel: w.label, date: dateISO });
      }
    }
    return slots;
  }

  async create(dto: CreateBookingInput): Promise<BookingWithWindow> {
    const dateISO = dto.date.slice(0, 10);
    const requestedTime = dto.date.slice(11, 16);

    // Pré-check (avant transaction, pour 99% des cas)
    const slots = await this.generateSlots(dateISO, dto.partySize);
    const slot = slots.find(s => s.time === requestedTime);
    if (!slot) throw new BadRequestException("Ce créneau n'est plus disponible.");

    const threshold = await this.settings.getAutoConfirmThreshold();
    const capacityMax = await this.settings.getCapacityMax();
    const durationMin = await this.settings.getDefaultMealDurationMin();
    const status: BookingStatus = dto.partySize <= threshold ? 'CONFIRMED' : 'PENDING';

    const slotStart = new Date(dto.date);
    const slotEnd = new Date(slotStart.getTime() + durationMin * MS_PER_MIN);

    // Race-condition guard : recheck capacité dans une transaction sérialisable
    const booking = await this.prisma.$transaction(
      async (tx) => {
        const occupied = await this.sumOccupiedAt(slotStart, slotEnd, tx);
        if (occupied + dto.partySize > capacityMax) {
          throw new ConflictException("Capacité dépassée pour ce créneau, veuillez choisir un autre horaire.");
        }
        return tx.booking.create({
          data: {
            partySize: dto.partySize,
            date: slotStart,
            serviceWindowId: slot.serviceWindowId,
            clientName: dto.clientName,
            clientEmail: dto.clientEmail,
            clientPhone: dto.clientPhone,
            notes: dto.notes ?? null,
            status,
            confirmedAt: status === 'CONFIRMED' ? new Date() : null,
          },
          include: { serviceWindow: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await this.notifications.onBookingCreated(booking);
    return booking;
  }

  async cancelByToken(cancelToken: string): Promise<BookingWithWindow> {
    const b = await this.prisma.booking.findUnique({ where: { cancelToken }, include: { serviceWindow: true } });
    if (!b) throw new NotFoundException('Réservation non trouvée');
    if (b.status === 'CANCELLED') throw new BadRequestException('Réservation déjà annulée');
    if (b.status === 'COMPLETED') throw new BadRequestException('Réservation déjà honorée, impossible à annuler');
    const updated = await this.prisma.booking.update({
      where: { id: b.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
      include: { serviceWindow: true },
    });
    await this.notifications.onBookingCancelled(updated, 'client');
    return updated;
  }

  async confirmByToken(confirmToken: string): Promise<BookingWithWindow> {
    const b = await this.prisma.booking.findUnique({ where: { confirmToken }, include: { serviceWindow: true } });
    if (!b) throw new NotFoundException('Réservation non trouvée');
    if (b.status === 'CANCELLED') throw new BadRequestException('Réservation annulée, impossible à confirmer');
    if (b.status === 'CONFIRMED') return b;
    return this.prisma.booking.update({
      where: { id: b.id },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
      include: { serviceWindow: true },
    });
  }

  async findAll(query: FindBookingsFilter) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const where: Prisma.BookingWhereInput = {};
    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = new Date(query.from);
      if (query.to) where.date.lte = new Date(query.to);
    }
    if (query.status) where.status = query.status;
    if (query.search) where.OR = [
      { clientName: { contains: query.search, mode: 'insensitive' } },
      { clientEmail: { contains: query.search, mode: 'insensitive' } },
      { clientPhone: { contains: query.search } },
    ];
    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where, include: { serviceWindow: true },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize, take: pageSize,
      }),
      this.prisma.booking.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findOne(id: string): Promise<BookingWithWindow> {
    const b = await this.prisma.booking.findUnique({ where: { id }, include: { serviceWindow: true } });
    if (!b) throw new NotFoundException();
    return b;
  }

  async update(id: string, dto: UpdateBookingInput): Promise<BookingWithWindow> {
    const data: Prisma.BookingUpdateInput = {};
    if (dto.partySize !== undefined) data.partySize = dto.partySize;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === 'CONFIRMED') data.confirmedAt = new Date();
      if (dto.status === 'CANCELLED') data.cancelledAt = new Date();
    }
    const updated = await this.prisma.booking.update({ where: { id }, data, include: { serviceWindow: true } });
    if (dto.status === 'CONFIRMED') await this.notifications.onBookingConfirmedByAdmin(updated);
    if (dto.status === 'CANCELLED') await this.notifications.onBookingCancelled(updated, 'admin');
    return updated;
  }

  async remove(id: string) {
    return this.prisma.booking.delete({ where: { id } });
  }

  async agenda(from: string, to: string): Promise<Record<string, BookingWithWindow[]>> {
    const items = await this.prisma.booking.findMany({
      where: {
        date: { gte: new Date(from), lte: new Date(to) },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: { serviceWindow: true },
      orderBy: { date: 'asc' },
    });
    const byDay: Record<string, BookingWithWindow[]> = {};
    for (const i of items) {
      const day = i.date.toISOString().slice(0, 10);
      (byDay[day] ??= []).push(i);
    }
    return byDay;
  }
}
