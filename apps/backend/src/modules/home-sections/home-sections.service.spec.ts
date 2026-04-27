import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { HomeSectionsService } from './home-sections.service';

describe('HomeSectionsService', () => {
  let service: HomeSectionsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      homeSection: {
        findMany: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({ _max: { sortOrder: -1 } }),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        HomeSectionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(HomeSectionsService);
  });

  describe('findAll', () => {
    it('retourne sections triées par sortOrder + image incluse', async () => {
      prisma.homeSection.findMany.mockResolvedValue([{ id: 's1' }]);
      await service.findAll();
      expect(prisma.homeSection.findMany).toHaveBeenCalledWith({
        orderBy: { sortOrder: 'asc' },
        include: expect.objectContaining({ image: expect.anything() }),
      });
    });
  });

  describe('findPublished', () => {
    it('filtre isPublished=true', async () => {
      prisma.homeSection.findMany.mockResolvedValue([]);
      await service.findPublished();
      expect(prisma.homeSection.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { isPublished: true },
      }));
    });
  });

  describe('create', () => {
    it('assigne sortOrder = max + 1', async () => {
      prisma.homeSection.aggregate.mockResolvedValue({ _max: { sortOrder: 4 } });
      prisma.homeSection.create.mockResolvedValue({ id: 's1' });
      await service.create({ title: 'X', body: 'Y' });
      expect(prisma.homeSection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ sortOrder: 5 }),
      });
    });

    it('assigne sortOrder=0 si aucune section existante', async () => {
      prisma.homeSection.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
      prisma.homeSection.create.mockResolvedValue({ id: 's1' });
      await service.create({ title: 'X', body: 'Y' });
      expect(prisma.homeSection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ sortOrder: 0 }),
      });
    });

    it('isPublished=true par défaut', async () => {
      prisma.homeSection.create.mockResolvedValue({ id: 's1' });
      await service.create({ title: 'X', body: 'Y' });
      expect(prisma.homeSection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isPublished: true }),
      });
    });

    it('imageId=null si non fourni', async () => {
      prisma.homeSection.create.mockResolvedValue({ id: 's1' });
      await service.create({ title: 'X', body: 'Y' });
      expect(prisma.homeSection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ imageId: null }),
      });
    });
  });

  describe('update', () => {
    it('disconnect image si imageId vide', async () => {
      prisma.homeSection.update.mockResolvedValue({});
      await service.update('s1', { imageId: '' });
      expect(prisma.homeSection.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: expect.objectContaining({ image: { disconnect: true } }),
      });
    });

    it('connect image si imageId fourni', async () => {
      prisma.homeSection.update.mockResolvedValue({});
      await service.update('s1', { imageId: 'img-42' });
      expect(prisma.homeSection.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: expect.objectContaining({ image: { connect: { id: 'img-42' } } }),
      });
    });

    it('update title/body sans toucher à l\'image', async () => {
      prisma.homeSection.update.mockResolvedValue({});
      await service.update('s1', { title: 'New' });
      const callData = prisma.homeSection.update.mock.calls[0][0].data;
      expect(callData.title).toBe('New');
      expect(callData.image).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('appelle prisma.delete', async () => {
      prisma.homeSection.delete.mockResolvedValue({ id: 's1' });
      await service.remove('s1');
      expect(prisma.homeSection.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
    });
  });

  describe('reorder', () => {
    it('assigne sortOrder=idx', async () => {
      prisma.homeSection.update.mockResolvedValue({});
      prisma.homeSection.findMany.mockResolvedValue([]);
      await service.reorder(['a', 'b', 'c']);
      expect(prisma.homeSection.update).toHaveBeenCalledTimes(3);
      expect(prisma.homeSection.update).toHaveBeenCalledWith({ where: { id: 'b' }, data: { sortOrder: 1 } });
    });
  });
});
