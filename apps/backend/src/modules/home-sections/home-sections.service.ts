import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TranslationService } from '../translation/translation.service';

function normalizeColor(c?: string | null): string | null {
  if (!c) return null;
  const v = c.trim();
  if (!v) return null;
  return v.startsWith('#') ? v : `#${v}`;
}

export interface CreateHomeSectionInput {
  title: string;
  body: string;
  imageId?: string;
  layout?: 'SPLIT' | 'FULL';
  bgColor?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  isPublished?: boolean;
  translations?: Record<string, { title?: string; body?: string; ctaLabel?: string }>;
}

export type UpdateHomeSectionInput = Partial<CreateHomeSectionInput>;

@Injectable()
export class HomeSectionsService {
  private readonly logger = new Logger(HomeSectionsService.name);

  constructor(private prisma: PrismaService, private translation: TranslationService) {}

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
    // Auto-translate via DeepL si activé : remplit les locales manquantes
    const merged = await this.autoFillTranslations(
      { title: dto.title, body: dto.body, ctaLabel: dto.ctaLabel ?? null },
      dto.translations,
    );
    return this.prisma.homeSection.create({
      data: {
        title: dto.title, body: dto.body,
        imageId: dto.imageId || null,
        layout: dto.layout ?? 'SPLIT',
        bgColor: normalizeColor(dto.bgColor),
        ctaLabel: dto.ctaLabel ?? null,
        ctaUrl: dto.ctaUrl ?? null,
        translations: merged ? (merged as Prisma.InputJsonValue) : Prisma.JsonNull,
        isPublished: dto.isPublished ?? true,
        sortOrder: (max._max.sortOrder ?? -1) + 1,
      },
    });
  }

  /** Si DeepL est configuré, complète les locales manquantes via traduction auto. */
  private async autoFillTranslations(
    source: { title?: string; body?: string; ctaLabel?: string | null },
    existing?: Record<string, { title?: string; body?: string; ctaLabel?: string }> | null,
  ) {
    if (!(await this.translation.isEnabled())) {
      return existing ?? null;
    }
    try {
      return await this.translation.autoTranslateSection(source, existing);
    } catch (e: any) {
      this.logger.warn(`Auto-translation failed: ${e.message}`);
      return existing ?? null;
    }
  }

  async update(id: string, dto: UpdateHomeSectionInput) {
    const { imageId, bgColor, translations, ...rest } = dto;
    const data: Prisma.HomeSectionUpdateInput = { ...rest };
    if ('imageId' in dto) {
      data.image = imageId ? { connect: { id: imageId } } : { disconnect: true };
    }
    if ('bgColor' in dto) data.bgColor = normalizeColor(bgColor);

    // Auto-translate dès qu'un champ FR ou une traduction est touché.
    // Si le FR a changé, on re-traduit les champs concernés (pas seulement ceux qui manquent).
    // Les overrides admin explicites (dto.translations) sont toujours préservés.
    const needsTranslate =
      'title' in dto || 'body' in dto || 'ctaLabel' in dto || 'translations' in dto;
    if (needsTranslate) {
      const current = await this.prisma.homeSection.findUnique({ where: { id } });
      const source = {
        title: dto.title ?? current?.title ?? '',
        body: dto.body ?? current?.body ?? '',
        ctaLabel: dto.ctaLabel ?? current?.ctaLabel ?? null,
      };

      // FR a-t-il changé pour chaque champ ?
      const titleChanged = 'title' in dto && dto.title !== current?.title;
      const bodyChanged = 'body' in dto && dto.body !== current?.body;
      const ctaChanged = 'ctaLabel' in dto && (dto.ctaLabel ?? null) !== (current?.ctaLabel ?? null);

      const existing = (current?.translations ?? {}) as Record<string, { title?: string; body?: string; ctaLabel?: string }>;
      const userOverrides = (translations ?? {}) as Record<string, { title?: string; body?: string; ctaLabel?: string }>;

      // Construit le "startWith" qu'on passe à autoTranslateSection :
      // - Garde les traductions existantes uniquement si le FR n'a pas changé
      // - User override > existing (toujours prioritaire)
      const startWith: Record<string, { title?: string; body?: string; ctaLabel?: string }> = {};
      for (const lang of ['en', 'es', 'it', 'de']) {
        const o: { title?: string; body?: string; ctaLabel?: string } = {};
        if (!titleChanged && existing[lang]?.title) o.title = existing[lang].title;
        if (!bodyChanged  && existing[lang]?.body)  o.body  = existing[lang].body;
        if (!ctaChanged   && existing[lang]?.ctaLabel) o.ctaLabel = existing[lang].ctaLabel;
        // User override toujours prioritaire
        if (userOverrides[lang]?.title) o.title = userOverrides[lang].title;
        if (userOverrides[lang]?.body)  o.body  = userOverrides[lang].body;
        if (userOverrides[lang]?.ctaLabel) o.ctaLabel = userOverrides[lang].ctaLabel;
        if (o.title || o.body || o.ctaLabel) startWith[lang] = o;
      }

      const merged = await this.autoFillTranslations(source, startWith);
      data.translations = merged ? (merged as Prisma.InputJsonValue) : Prisma.JsonNull;
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
