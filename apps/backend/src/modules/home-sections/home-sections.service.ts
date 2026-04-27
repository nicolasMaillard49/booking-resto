import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateHomeSectionInput {
  title: string;
  body: string;
  imageId?: string;
  isPublished?: boolean;
}

export type UpdateHomeSectionInput = Partial<CreateHomeSectionInput>;

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

  async create(dto: CreateHomeSectionInput) {
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

  async update(id: string, dto: UpdateHomeSectionInput) {
    const data: Prisma.HomeSectionUpdateInput = { ...dto };
    if ('imageId' in dto && !dto.imageId) data.image = { disconnect: true };
    if ('imageId' in dto && dto.imageId) {
      data.image = { connect: { id: dto.imageId } };
      delete (data as Record<string, unknown>).imageId;
    }
    return this.prisma.homeSection.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.homeSection.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    await Promise.all(ids.map((id, idx) => this.prisma.homeSection.update({ where: { id }, data: { sortOrder: idx } })));
    return this.findAll();
  }
}
