import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ImagesService } from './images.service';

// JPEG header
const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
// PNG header
const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
// PDF header
const PDF_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
// WEBP : RIFF....WEBP
function webpBuffer(): Buffer {
  const b = Buffer.alloc(20);
  b.write('RIFF', 0, 'ascii');
  b.write('WEBP', 8, 'ascii');
  return b;
}

describe('ImagesService', () => {
  let service: ImagesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      image: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ImagesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(ImagesService);
  });

  describe('upload', () => {
    const baseInput = (over: Partial<any> = {}) => ({
      section: 'HOMESECTION' as const,
      mimeType: 'image/jpeg',
      size: JPEG_BYTES.length,
      buffer: JPEG_BYTES,
      ...over,
    });

    it('rejette si section invalide', async () => {
      await expect(service.upload(baseInput({ section: 'BAD' as any })))
        .rejects.toThrow(BadRequestException);
    });

    it('rejette si mimeType non whitelisté', async () => {
      await expect(service.upload(baseInput({ mimeType: 'image/svg+xml' })))
        .rejects.toThrow(BadRequestException);
    });

    it('rejette si size > 5 Mo', async () => {
      const big = Buffer.alloc(6 * 1024 * 1024);
      // Donner un header JPEG valide
      JPEG_BYTES.copy(big, 0);
      await expect(service.upload(baseInput({ size: big.length, buffer: big })))
        .rejects.toThrow(/5\s?Mo|trop volumineux/i);
    });

    it('rejette si magic-bytes ne matchent pas le mimeType (anti-spoofing)', async () => {
      // ZIP file pretending to be JPEG
      const fake = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
      await expect(service.upload(baseInput({ buffer: fake })))
        .rejects.toThrow(/contenu/i);
    });

    it('accepte JPEG valide', async () => {
      prisma.image.create.mockResolvedValue({ id: 'img1' });
      const r = await service.upload(baseInput());
      expect(r.id).toBe('img1');
    });

    it('accepte PNG valide', async () => {
      prisma.image.create.mockResolvedValue({ id: 'img1' });
      await service.upload(baseInput({ mimeType: 'image/png', buffer: PNG_BYTES, size: PNG_BYTES.length }));
      expect(prisma.image.create).toHaveBeenCalled();
    });

    it('accepte WEBP valide', async () => {
      prisma.image.create.mockResolvedValue({ id: 'img1' });
      const buf = webpBuffer();
      await service.upload(baseInput({ mimeType: 'image/webp', buffer: buf, size: buf.length }));
      expect(prisma.image.create).toHaveBeenCalled();
    });

    it('accepte PDF valide et set width/height = null', async () => {
      prisma.image.create.mockResolvedValue({ id: 'img-pdf' });
      await service.upload(baseInput({ mimeType: 'application/pdf', buffer: PDF_BYTES, size: PDF_BYTES.length, section: 'MENU' }));
      expect(prisma.image.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ mimeType: 'application/pdf', width: null, height: null }),
      }));
    });

    it('persiste width/height pour image (pas PDF)', async () => {
      prisma.image.create.mockResolvedValue({ id: 'img1' });
      await service.upload(baseInput({ width: 800, height: 600 }));
      expect(prisma.image.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ width: 800, height: 600 }),
      }));
    });

    it('caption=null si non fournie', async () => {
      prisma.image.create.mockResolvedValue({ id: 'img1' });
      await service.upload(baseInput());
      expect(prisma.image.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ caption: null }),
      }));
    });

    it('rejette si buffer < 4 octets (magic-bytes impossible)', async () => {
      const tiny = Buffer.from([0xff, 0xd8]);
      await expect(service.upload(baseInput({ buffer: tiny, size: tiny.length })))
        .rejects.toThrow(/contenu/i);
    });
  });

  describe('findBySection', () => {
    it('filtre par section et trie', async () => {
      prisma.image.findMany.mockResolvedValue([]);
      await service.findBySection('MENU');
      expect(prisma.image.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { section: 'MENU' },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }));
    });

    it('exclut le buffer data du select (perf)', async () => {
      prisma.image.findMany.mockResolvedValue([]);
      await service.findBySection('HOMESECTION');
      const call = prisma.image.findMany.mock.calls[0][0];
      expect(call.select).toBeDefined();
      expect(call.select.data).toBeUndefined();
    });
  });

  describe('getRaw', () => {
    it('lève NotFoundException si id introuvable', async () => {
      prisma.image.findUnique.mockResolvedValue(null);
      await expect(service.getRaw('bad')).rejects.toThrow(NotFoundException);
    });

    it('retourne l\'image avec data', async () => {
      const img = { id: 'i1', mimeType: 'image/jpeg', data: Buffer.from('x') };
      prisma.image.findUnique.mockResolvedValue(img);
      expect(await service.getRaw('i1')).toBe(img);
    });
  });

  describe('update', () => {
    it('appelle prisma.update', async () => {
      prisma.image.update.mockResolvedValue({});
      await service.update('i1', { caption: 'New' });
      expect(prisma.image.update).toHaveBeenCalledWith({
        where: { id: 'i1' }, data: { caption: 'New' },
      });
    });
  });

  describe('remove', () => {
    it('appelle prisma.delete', async () => {
      prisma.image.delete.mockResolvedValue({ id: 'i1' });
      await service.remove('i1');
      expect(prisma.image.delete).toHaveBeenCalledWith({ where: { id: 'i1' } });
    });

    it('propage P2003 (FK violation, image utilisée par MenuDocument)', async () => {
      const err: any = new Error('P2003'); err.code = 'P2003';
      prisma.image.delete.mockRejectedValue(err);
      await expect(service.remove('i1')).rejects.toMatchObject({ code: 'P2003' });
    });
  });

  describe('reorder', () => {
    it('assigne sortOrder=idx pour chaque id', async () => {
      prisma.image.update.mockResolvedValue({});
      await service.reorder(['a', 'b']);
      expect(prisma.image.update).toHaveBeenCalledTimes(2);
      expect(prisma.image.update).toHaveBeenCalledWith({ where: { id: 'a' }, data: { sortOrder: 0 } });
      expect(prisma.image.update).toHaveBeenCalledWith({ where: { id: 'b' }, data: { sortOrder: 1 } });
    });
  });
});
