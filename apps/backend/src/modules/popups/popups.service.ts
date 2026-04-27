import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const POPUP_INCLUDE = { image: { select: { id: true, mimeType: true, width: true, height: true } } };

@Injectable()
export class PopupsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.popup.findMany({ orderBy: { createdAt: 'desc' }, include: POPUP_INCLUDE });
  }

  findActive() {
    const now = new Date();
    return this.prisma.popup.findFirst({
      where: {
        isActive: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
      orderBy: { updatedAt: 'desc' },
      include: POPUP_INCLUDE,
    });
  }

  async create(dto: Prisma.PopupCreateInput) {
    return this.prisma.popup.create({ data: dto, include: POPUP_INCLUDE });
  }

  async update(id: string, dto: Prisma.PopupUpdateInput) {
    return this.prisma.popup.update({ where: { id }, data: dto, include: POPUP_INCLUDE });
  }

  async remove(id: string) {
    return this.prisma.popup.delete({ where: { id } });
  }
}
