import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(MenuDocumentsService.name);

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

  /**
   * À l'update, si le fileId change → on supprime l'ancienne Image
   * (elle est dédiée au menu, on ne stocke jamais les fichiers d'anciens menus).
   */
  async update(id: string, dto: UpdateMenuDocumentInput) {
    const before = await this.prisma.menuDocument.findUnique({ where: { id } });
    const updated = await this.prisma.menuDocument.update({ where: { id }, data: dto });

    if (before && dto.fileId && dto.fileId !== before.fileId) {
      await this.deleteOrphanImage(before.fileId);
    }
    return updated;
  }

  /**
   * À la suppression d'un menu, on supprime aussi son Image associée.
   */
  async remove(id: string) {
    const before = await this.prisma.menuDocument.findUnique({ where: { id } });
    const deleted = await this.prisma.menuDocument.delete({ where: { id } });
    if (before) await this.deleteOrphanImage(before.fileId);
    return deleted;
  }

  /** Supprime une Image si elle n'est plus référencée nulle part (sécurité). */
  private async deleteOrphanImage(imageId: string): Promise<void> {
    try {
      // Vérif : image encore référencée ?
      const stillUsedAsMenu = await this.prisma.menuDocument.count({ where: { fileId: imageId } });
      if (stillUsedAsMenu > 0) return;
      const stillUsedAsHero = await this.prisma.homeSection.count({ where: { imageId } });
      if (stillUsedAsHero > 0) return;
      const stillUsedAsPopup = await this.prisma.popup.count({ where: { imageId } });
      if (stillUsedAsPopup > 0) return;

      await this.prisma.image.delete({ where: { id: imageId } });
      this.logger.log(`Image orpheline ${imageId} supprimée (libère le stockage).`);
    } catch (e: any) {
      // Pas critique : on log et on continue
      this.logger.warn(`Échec cleanup image ${imageId}: ${e.message}`);
    }
  }

  async reorder(ids: string[]) {
    await Promise.all(ids.map((id, idx) => this.prisma.menuDocument.update({ where: { id }, data: { sortOrder: idx } })));
    return this.findAll();
  }
}
