import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ServiceWindowsService {
  constructor(private prisma: PrismaService) {}

  private validateTimes(startTime: string, endTime: string) {
    if (startTime >= endTime) throw new BadRequestException('endTime doit être strictement supérieur à startTime');
  }

  findAll() {
    return this.prisma.serviceWindow.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  }

  findActiveForDay(dayOfWeek: number) {
    return this.prisma.serviceWindow.findMany({
      where: { isActive: true, daysOfWeek: { has: dayOfWeek } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(dto: { label: string; daysOfWeek: number[]; startTime: string; endTime: string; isActive?: boolean }) {
    this.validateTimes(dto.startTime, dto.endTime);
    return this.prisma.serviceWindow.create({ data: { ...dto, isActive: dto.isActive ?? true } });
  }

  async update(id: string, dto: Partial<{ label: string; daysOfWeek: number[]; startTime: string; endTime: string; isActive: boolean }>) {
    if (dto.startTime && dto.endTime) this.validateTimes(dto.startTime, dto.endTime);
    return this.prisma.serviceWindow.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.serviceWindow.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    await Promise.all(ids.map((id, idx) =>
      this.prisma.serviceWindow.update({ where: { id }, data: { sortOrder: idx } }),
    ));
    return this.findAll();
  }
}
