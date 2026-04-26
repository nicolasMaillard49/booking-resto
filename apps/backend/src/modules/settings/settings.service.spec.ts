import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from './settings.service';
import { DEFAULTS } from './settings.constants';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: { setting: { findMany: jest.Mock; upsert: jest.Mock } };

  beforeEach(async () => {
    prisma = { setting: { findMany: jest.fn(), upsert: jest.fn() } };
    const moduleRef = await Test.createTestingModule({
      providers: [SettingsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(SettingsService);
  });

  describe('getAll', () => {
    it('renvoie les settings DB superposés sur les defaults', async () => {
      prisma.setting.findMany.mockResolvedValue([
        { key: 'capacity_max', value: '50' },
        { key: 'brand_name',   value: 'La Rencontre' },
      ]);
      const all = await service.getAll();
      expect(all.capacity_max).toBe('50');
      expect(all.brand_name).toBe('La Rencontre');
      expect(all.lookahead_days).toBe(DEFAULTS.lookahead_days);
    });
  });

  describe('typed getters', () => {
    beforeEach(() => prisma.setting.findMany.mockResolvedValue([
      { key: 'capacity_max', value: '40' },
      { key: 'auto_confirm_threshold', value: '8' },
      { key: 'brand_name', value: 'Test Resto' },
    ]));

    it('getCapacityMax cast en number', async () => {
      expect(await service.getCapacityMax()).toBe(40);
    });
    it('getAutoConfirmThreshold cast en number', async () => {
      expect(await service.getAutoConfirmThreshold()).toBe(8);
    });
    it('getBrandName renvoie string', async () => {
      expect(await service.getBrandName()).toBe('Test Resto');
    });
  });

  describe('updateMany', () => {
    it('rejette les clés non whitelistées', async () => {
      await expect(service.updateMany({ malicious_key: 'x' } as any))
        .rejects.toThrow(/non autoris/);
    });

    it('upsert chaque clé valide', async () => {
      prisma.setting.upsert.mockResolvedValue({});
      await service.updateMany({ capacity_max: '50', brand_name: 'X' });
      expect(prisma.setting.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: 'capacity_max' },
        update: { value: '50' },
        create: { key: 'capacity_max', value: '50' },
      });
    });
  });
});
