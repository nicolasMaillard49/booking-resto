import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateBlockedSlotDto } from './dto/create-blocked-slot.dto';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /** Horaires hebdomadaires publics */
  async getSchedule() {
    return this.prisma.availability.findMany({
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  /** Mise à jour des horaires (admin) */
  async updateSchedule(dto: UpdateScheduleDto) {
    await this.prisma.$transaction(
      dto.schedule.map((day) =>
        this.prisma.availability.upsert({
          where: { dayOfWeek: day.dayOfWeek },
          update: {
            startTime: day.startTime,
            endTime: day.endTime,
            isActive: day.isActive,
          },
          create: {
            dayOfWeek: day.dayOfWeek,
            startTime: day.startTime,
            endTime: day.endTime,
            isActive: day.isActive,
          },
        }),
      ),
    );

    return { success: true };
  }

  /** Bloquer un créneau (congé, fermeture exceptionnelle) */
  async blockSlot(dto: CreateBlockedSlotDto) {
    return this.prisma.blockedSlot.create({
      data: {
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason,
      },
    });
  }

  /** Supprimer un créneau bloqué */
  async unblockSlot(id: string) {
    const slot = await this.prisma.blockedSlot.findUnique({ where: { id } });

    if (!slot) {
      throw new NotFoundException('Créneau bloqué introuvable');
    }

    await this.prisma.blockedSlot.delete({ where: { id } });
    return { success: true };
  }

  /** Liste des créneaux bloqués (admin) */
  async getBlockedSlots() {
    return this.prisma.blockedSlot.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: 'asc' },
    });
  }
}
