import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ImageSection, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface UploadImageInput {
  section: ImageSection;
  mimeType: string;
  size: number;
  buffer: Buffer;
  caption?: string;
  width?: number;
  height?: number;
}

export type UpdateImageInput = Partial<{ caption: string; sortOrder: number; section: ImageSection }>;

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const ALLOWED_SECTIONS = new Set(['HERO', 'HOMESECTION', 'MENU', 'OTHER']);

/** Vérifie les magic-bytes pour empêcher le spoofing extension/mimeType. */
function detectMime(buf: Buffer): string | null {
  if (buf.length < 4) return null;
  // JPEG : FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  // PNG : 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  // PDF : 25 50 44 46
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return 'application/pdf';
  // WEBP : RIFF....WEBP
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

@Injectable()
export class ImagesService {
  constructor(private prisma: PrismaService) {}

  async upload(input: UploadImageInput) {
    if (!ALLOWED_SECTIONS.has(input.section)) throw new BadRequestException('Section invalide');
    if (!ALLOWED_MIMES.has(input.mimeType))   throw new BadRequestException('mimeType non autorisé');
    if (input.size > MAX_SIZE)                throw new BadRequestException('Fichier trop volumineux (max 5 Mo)');

    const detected = detectMime(input.buffer);
    if (detected !== input.mimeType) {
      throw new BadRequestException('Le contenu du fichier ne correspond pas au type déclaré');
    }

    const isPdf = input.mimeType === 'application/pdf';
    return this.prisma.image.create({
      data: {
        section: input.section,
        mimeType: input.mimeType,
        size: input.size,
        width:  isPdf ? null : (input.width ?? 0),
        height: isPdf ? null : (input.height ?? 0),
        data: input.buffer,
        caption: input.caption ?? null,
      },
      select: { id: true, section: true, mimeType: true, width: true, height: true, size: true, caption: true, createdAt: true },
    });
  }

  findBySection(section: ImageSection) {
    return this.prisma.image.findMany({
      where: { section },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: { id: true, section: true, mimeType: true, width: true, height: true, size: true, sortOrder: true, caption: true, createdAt: true },
    });
  }

  async getRaw(id: string) {
    const img = await this.prisma.image.findUnique({ where: { id } });
    if (!img) throw new NotFoundException();
    return img;
  }

  async update(id: string, dto: UpdateImageInput) {
    return this.prisma.image.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    // P2003 (FK violation, image référencée par MenuDocument) et P2025 (not found)
    // sont gérés globalement par PrismaExceptionFilter.
    return this.prisma.image.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    await Promise.all(ids.map((id, idx) =>
      this.prisma.image.update({ where: { id }, data: { sortOrder: idx } }),
    ));
    return { ok: true };
  }
}
