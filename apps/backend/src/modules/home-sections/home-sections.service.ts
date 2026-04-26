import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HomeSectionsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.homeSection.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { image: { select: { id: true, mimeType: true, width: true, height: true } } },
    });
  }

  findPublished() {
    return this.prisma.homeSection.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
      include: { image: { select: { id: true, mimeType: true, width: true, height: true } } },
    });
  }

  async create(dto: { title: string; body: string; imageId?: string; isPublished?: boolean }) {
    const max = await this.prisma.homeSection.aggregate({ _max: { sortOrder: true } });
    return this.prisma.homeSection.create({
      data: {
        title: dto.title, body: dto.body,
        imageId: dto.imageId || null,
        isPublished: dto.isPublished ?? true,
        sortOrder: (max._max.sortOrder ?? -1) + 1,
      },
    });
  }

  async update(id: string, dto: any) {
    try {
      const data: any = { ...dto };
      if ('imageId' in data && !data.imageId) data.imageId = null;
      return await this.prisma.homeSection.update({ where: { id }, data });
    } catch { throw new NotFoundException(); }
  }

  async remove(id: string) {
    try { return await this.prisma.homeSection.delete({ where: { id } }); }
    catch { throw new NotFoundException(); }
  }

  async reorder(ids: string[]) {
    await Promise.all(ids.map((id, idx) => this.prisma.homeSection.update({ where: { id }, data: { sortOrder: idx } })));
    return this.findAll();
  }
}
