import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ScheduleExceptionsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.scheduleException.findMany({ orderBy: { startDate: 'asc' } });
  }

  async create(dto: { startDate: string; endDate: string; reason?: string }) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start) throw new BadRequestException('endDate doit être >= startDate');
    return this.prisma.scheduleException.create({
      data: { startDate: start, endDate: end, reason: dto.reason ?? null },
    });
  }

  async remove(id: string) {
    return this.prisma.scheduleException.delete({ where: { id } });
  }

  async isDateBlocked(date: Date): Promise<boolean> {
    const d = new Date(date); d.setUTCHours(0, 0, 0, 0);
    const found = await this.prisma.scheduleException.findFirst({
      where: { startDate: { lte: d }, endDate: { gte: d } },
    });
    return !!found;
  }
}
