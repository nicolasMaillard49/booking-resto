import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateMenuDocumentInput {
  title: string;
  description?: string;
  fileId: string;
  isPublished?: boolean;
}

export type UpdateMenuDocumentInput = Partial<CreateMenuDocumentInput>;

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

  async create(dto: CreateMenuDocumentInput) {
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

  async update(id: string, dto: UpdateMenuDocumentInput) {
    return this.prisma.menuDocument.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.menuDocument.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    await Promise.all(ids.map((id, idx) => this.prisma.menuDocument.update({ where: { id }, data: { sortOrder: idx } })));
    return this.findAll();
  }
}
