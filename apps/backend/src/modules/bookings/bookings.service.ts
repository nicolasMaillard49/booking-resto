// ============================================================
// BookingsService — Cœur du système de réservation
// Logique complexe: calcul des créneaux disponibles
// ============================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { GetBookingsQueryDto } from './dto/get-bookings-query.dto';
import { BookingStatus } from '@prisma/client';

// Intervalle des créneaux en minutes
const SLOT_INTERVAL_MINUTES = 30;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─────────────────────────────────────────────────────────
  // CRÉNEAUX DISPONIBLES
  // ─────────────────────────────────────────────────────────
  async getAvailability(dateStr: string, serviceDuration?: number) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Date invalide. Format attendu: YYYY-MM-DD');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return { date: dateStr, slots: [], reason: 'date_passed' };
    }

    // 0=lundi, 1=mardi, ..., 6=dimanche en France (getDay: 0=dimanche)
    const jsDay = date.getDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

    const availability = await this.prisma.availability.findFirst({
      where: { dayOfWeek, isActive: true },
    });

    if (!availability) {
      return { date: dateStr, slots: [], reason: 'closed' };
    }

    const duration = serviceDuration ?? SLOT_INTERVAL_MINUTES;

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existingBookings = await this.prisma.booking.findMany({
      where: {
        date: { gte: dayStart, lte: dayEnd },
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
      select: { date: true, duration: true },
    });

    const blockedSlots = await this.prisma.blockedSlot.findMany({
      where: { date: dayStart },
      select: { startTime: true, endTime: true },
    });

    const slots = this.generateSlots(
      date,
      availability.startTime,
      availability.endTime,
      duration,
      existingBookings,
      blockedSlots,
    );

    return { date: dateStr, slots };
  }

  private generateSlots(
    date: Date,
    startTime: string,
    endTime: string,
    serviceDuration: number,
    bookedSlots: { date: Date; duration: number }[],
    blockedSlots: { startTime: string; endTime: string }[],
  ): { time: string; available: boolean }[] {
    const slots: { time: string; available: boolean }[] = [];

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const openMinutes = startHour * 60 + startMin;
    const closeMinutes = endHour * 60 + endMin;

    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    const occupiedRanges = bookedSlots.map((booking) => {
      const bookingTime = new Date(booking.date);
      const startMin = bookingTime.getHours() * 60 + bookingTime.getMinutes();
      return { start: startMin, end: startMin + booking.duration };
    });

    for (const blocked of blockedSlots) {
      const [bStartH, bStartM] = blocked.startTime.split(':').map(Number);
      const [bEndH, bEndM] = blocked.endTime.split(':').map(Number);
      occupiedRanges.push({
        start: bStartH * 60 + bStartM,
        end: bEndH * 60 + bEndM,
      });
    }

    for (
      let currentMin = openMinutes;
      currentMin + serviceDuration <= closeMinutes;
      currentMin += SLOT_INTERVAL_MINUTES
    ) {
      const slotEnd = currentMin + serviceDuration;

      if (isToday) {
        const currentTimeMinutes = now.getHours() * 60 + now.getMinutes() + 30; // Buffer 30min
        if (currentMin <= currentTimeMinutes) {
          continue;
        }
      }

      const isOccupied = occupiedRanges.some(
        (range) => currentMin < range.end && slotEnd > range.start,
      );

      const hours = Math.floor(currentMin / 60).toString().padStart(2, '0');
      const mins = (currentMin % 60).toString().padStart(2, '0');

      slots.push({
        time: `${hours}:${mins}`,
        available: !isOccupied,
      });
    }

    return slots;
  }

  // ─────────────────────────────────────────────────────────
  // CRÉER UNE RÉSERVATION
  // ─────────────────────────────────────────────────────────
  async create(dto: CreateBookingDto) {
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, isActive: true },
    });

    if (!service) {
      throw new NotFoundException('Service introuvable ou inactif');
    }

    const bookingDate = new Date(dto.date);

    if (bookingDate <= new Date()) {
      throw new BadRequestException('La date de réservation doit être dans le futur');
    }

    await this.assertSlotAvailable(bookingDate, service.duration);

    const booking = await this.prisma.booking.create({
      data: {
        serviceId: service.id,
        clientName: dto.clientName,
        clientEmail: dto.clientEmail.toLowerCase(),
        clientPhone: dto.clientPhone,
        date: bookingDate,
        duration: service.duration,
        notes: dto.notes,
        amount: service.price,
        status: BookingStatus.PENDING,
      },
      include: { service: true },
    });

    this.notifications.sendBookingConfirmation(booking).catch((err) => {
      console.error('Erreur envoi email confirmation:', err);
    });

    this.notifications.sendNewBookingToAdmin(booking).catch((err) => {
      console.error('Erreur envoi email admin:', err);
    });

    return {
      id: booking.id,
      cancelToken: booking.cancelToken,
      status: booking.status,
      date: booking.date,
      service: {
        name: booking.service.name,
        duration: booking.service.duration,
      },
      clientName: booking.clientName,
      message: 'Votre réservation a bien été enregistrée. Un email de confirmation vous a été envoyé.',
    };
  }

  private async assertSlotAvailable(date: Date, duration: number) {
    const slotEnd = new Date(date.getTime() + duration * 60 * 1000);

    const conflicting = await this.prisma.booking.findFirst({
      where: {
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        AND: [
          { date: { lt: slotEnd } },
          {
            date: {
              gte: new Date(date.getTime() - 8 * 60 * 60 * 1000),
            },
          },
        ],
      },
    });

    if (conflicting) {
      const existingEnd = new Date(
        conflicting.date.getTime() + conflicting.duration * 60 * 1000,
      );
      if (date < existingEnd && slotEnd > conflicting.date) {
        throw new BadRequestException('Ce créneau n\'est plus disponible');
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // ANNULER (lien email)
  // ─────────────────────────────────────────────────────────
  async cancelByToken(cancelToken: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { cancelToken },
      include: { service: true },
    });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      return { message: 'Cette réservation est déjà annulée', status: 'already_cancelled' };
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Impossible d\'annuler un RDV complété');
    }

    const twoHoursBefore = new Date(booking.date.getTime() - 2 * 60 * 60 * 1000);
    if (new Date() > twoHoursBefore) {
      throw new BadRequestException(
        'Annulation impossible moins de 2 heures avant le rendez-vous',
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    this.notifications.sendCancellationEmail({ ...booking, ...updated }).catch(console.error);

    return {
      message: 'Votre réservation a bien été annulée',
      status: 'cancelled',
    };
  }

  // ─────────────────────────────────────────────────────────
  // CONFIRMER (lien email)
  // ─────────────────────────────────────────────────────────
  async confirmByToken(confirmToken: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { confirmToken },
    });

    if (!booking) {
      throw new NotFoundException('Lien de confirmation invalide');
    }

    if (booking.status === BookingStatus.CONFIRMED) {
      return { message: 'Réservation déjà confirmée', status: 'already_confirmed' };
    }

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
    });

    return { message: 'Réservation confirmée avec succès', status: 'confirmed' };
  }

  // ─────────────────────────────────────────────────────────
  // LISTE ADMIN (paginée + filtres)
  // ─────────────────────────────────────────────────────────
  async findAll(query: GetBookingsQueryDto) {
    const { page = 1, limit = 20, status, date } = query;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (date) {
      const filterDate = date === 'today' ? new Date() : new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      const dayEnd = new Date(filterDate);
      dayEnd.setHours(23, 59, 59, 999);
      where.date = { gte: filterDate, lte: dayEnd };
    }

    const [total, bookings] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        include: {
          service: { select: { id: true, name: true, duration: true, price: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: Math.min(limit, 100),
      }),
    ]);

    return {
      data: bookings,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable');
    }

    return booking;
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable');
    }

    const updateData: Record<string, unknown> = { status: dto.status };

    if (dto.status === BookingStatus.CONFIRMED && !booking.confirmedAt) {
      updateData.confirmedAt = new Date();
    }
    if (dto.status === BookingStatus.CANCELLED && !booking.cancelledAt) {
      updateData.cancelledAt = new Date();
    }
    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }

    return this.prisma.booking.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable');
    }

    await this.prisma.booking.delete({ where: { id } });
    return { success: true };
  }
}
