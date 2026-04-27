import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { MenuDocumentsService } from './menu-documents.service';

describe('MenuDocumentsService', () => {
  let service: MenuDocumentsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      menuDocument: {
        findMany: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({ _max: { sortOrder: -1 } }),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        MenuDocumentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(MenuDocumentsService);
  });

  describe('findAll', () => {
    it('retourne docs triés + file inclus', async () => {
      prisma.menuDocument.findMany.mockResolvedValue([]);
      await service.findAll();
      expect(prisma.menuDocument.findMany).toHaveBeenCalledWith(expect.objectContaining({
        orderBy: { sortOrder: 'asc' },
        include: expect.objectContaining({ file: expect.anything() }),
      }));
    });
  });

  describe('findPublished', () => {
    it('filtre isPublished=true', async () => {
      prisma.menuDocument.findMany.mockResolvedValue([]);
      await service.findPublished();
      expect(prisma.menuDocument.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { isPublished: true },
      }));
    });
  });

  describe('create', () => {
    it('assigne sortOrder = max + 1', async () => {
      prisma.menuDocument.aggregate.mockResolvedValue({ _max: { sortOrder: 2 } });
      prisma.menuDocument.create.mockResolvedValue({ id: 'd1' });
      await service.create({ title: 'Midi', fileId: 'img-1' });
      expect(prisma.menuDocument.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ sortOrder: 3 }),
      });
    });

    it('isPublished=true par défaut', async () => {
      prisma.menuDocument.create.mockResolvedValue({ id: 'd1' });
      await service.create({ title: 'Midi', fileId: 'img-1' });
      expect(prisma.menuDocument.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isPublished: true }),
      });
    });

    it('description=null si non fournie', async () => {
      prisma.menuDocument.create.mockResolvedValue({ id: 'd1' });
      await service.create({ title: 'Midi', fileId: 'img-1' });
      expect(prisma.menuDocument.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ description: null }),
      });
    });

    it('persiste description si fournie', async () => {
      prisma.menuDocument.create.mockResolvedValue({ id: 'd1' });
      await service.create({ title: 'Midi', fileId: 'img-1', description: 'Plat du jour' });
      expect(prisma.menuDocument.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ description: 'Plat du jour' }),
      });
    });
  });

  describe('update', () => {
    it('appelle prisma.update', async () => {
      prisma.menuDocument.update.mockResolvedValue({});
      await service.update('d1', { title: 'New' });
      expect(prisma.menuDocument.update).toHaveBeenCalledWith({
        where: { id: 'd1' }, data: { title: 'New' },
      });
    });
  });

  describe('remove', () => {
    it('appelle prisma.delete', async () => {
      prisma.menuDocument.delete.mockResolvedValue({ id: 'd1' });
      await service.remove('d1');
      expect(prisma.menuDocument.delete).toHaveBeenCalledWith({ where: { id: 'd1' } });
    });
  });

  describe('reorder', () => {
    it('assigne sortOrder=idx', async () => {
      prisma.menuDocument.update.mockResolvedValue({});
      prisma.menuDocument.findMany.mockResolvedValue([]);
      await service.reorder(['x', 'y']);
      expect(prisma.menuDocument.update).toHaveBeenCalledWith({ where: { id: 'x' }, data: { sortOrder: 0 } });
      expect(prisma.menuDocument.update).toHaveBeenCalledWith({ where: { id: 'y' }, data: { sortOrder: 1 } });
    });

    it('renvoie findAll après reorder', async () => {
      prisma.menuDocument.update.mockResolvedValue({});
      prisma.menuDocument.findMany.mockResolvedValue([{ id: 'x' }]);
      const r = await service.reorder(['x']);
      expect(r).toEqual([{ id: 'x' }]);
    });
  });
});
