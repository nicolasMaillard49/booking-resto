import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MenuDocumentsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.menuDocument.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { file: { select: { id: true, mimeType: true, size: true } } },
    });
  }

  findPublished() {
    return this.prisma.menuDocument.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
      include: { file: { select: { id: true, mimeType: true, size: true } } },
    });
  }

  async create(dto: { title: string; description?: string; fileId: string; isPublished?: boolean }) {
    const max = await this.prisma.menuDocument.aggregate({ _max: { sortOrder: true } });
    return this.prisma.menuDocument.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        fileId: dto.fileId,
        isPublished: dto.isPublished ?? true,
        sortOrder: (max._max.sortOrder ?? -1) + 1,
      },
    });
  }

  async update(id: string, dto: any) {
    try { return await this.prisma.menuDocument.update({ where: { id }, data: dto }); }
    catch { throw new NotFoundException(); }
  }

  async remove(id: string) {
    try { return await this.prisma.menuDocument.delete({ where: { id } }); }
    catch { throw new NotFoundException(); }
  }

  async reorder(ids: string[]) {
    await Promise.all(ids.map((id, idx) => this.prisma.menuDocument.update({ where: { id }, data: { sortOrder: idx } })));
    return this.findAll();
  }
}
