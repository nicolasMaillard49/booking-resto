import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CaptchaService } from './captcha.service';
import { ContactMessagesService } from './contact-messages.service';

describe('ContactMessagesService', () => {
  let service: ContactMessagesService;
  let prisma: any;
  let notif: any;
  let captcha: any;

  beforeEach(async () => {
    prisma = {
      contactMessage: {
        create: jest.fn().mockResolvedValue({ id: 'm1' }),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    notif = { onContactMessage: jest.fn() };
    captcha = { verify: jest.fn().mockReturnValue(true) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ContactMessagesService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notif },
        { provide: CaptchaService, useValue: captcha },
      ],
    }).compile();
    service = moduleRef.get(ContactMessagesService);
  });

  describe('create', () => {
    const dto = { name: 'X', email: 'x@x.fr', message: 'Hello', captchaToken: 't', captchaAnswer: '5' };

    it('rejette BadRequestException si captcha invalide', async () => {
      captcha.verify.mockReturnValue(false);
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(prisma.contactMessage.create).not.toHaveBeenCalled();
    });

    it('persiste le message si captcha OK', async () => {
      await service.create(dto);
      expect(prisma.contactMessage.create).toHaveBeenCalledWith({
        data: { name: 'X', email: 'x@x.fr', message: 'Hello' },
      });
    });

    it('appelle notifications.onContactMessage', async () => {
      await service.create(dto);
      expect(notif.onContactMessage).toHaveBeenCalledWith({ name: 'X', email: 'x@x.fr', message: 'Hello' });
    });

    it('renvoie { id } sans le contenu pour limiter exposition', async () => {
      const r = await service.create(dto);
      expect(r).toEqual({ id: 'm1' });
    });
  });

  describe('findAll', () => {
    it('paginé desc par createdAt', async () => {
      prisma.contactMessage.findMany.mockResolvedValue([{ id: 'm1' }]);
      prisma.contactMessage.count.mockResolvedValue(1);
      const r = await service.findAll(1, 20);
      expect(r.items).toHaveLength(1);
      expect(r.total).toBe(1);
      expect(prisma.contactMessage.findMany).toHaveBeenCalledWith(expect.objectContaining({
        orderBy: { createdAt: 'desc' },
        skip: 0, take: 20,
      }));
    });

    it('respecte page=2 (skip = pageSize)', async () => {
      await service.findAll(2, 10);
      expect(prisma.contactMessage.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 10, take: 10,
      }));
    });

    it('valeurs par défaut page=1, pageSize=20', async () => {
      await service.findAll();
      expect(prisma.contactMessage.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0, take: 20,
      }));
    });
  });

  describe('setRead', () => {
    it('update isRead', async () => {
      prisma.contactMessage.update.mockResolvedValue({ id: 'm1', isRead: true });
      await service.setRead('m1', true);
      expect(prisma.contactMessage.update).toHaveBeenCalledWith({
        where: { id: 'm1' }, data: { isRead: true },
      });
    });
  });

  describe('remove', () => {
    it('delete par id', async () => {
      prisma.contactMessage.delete.mockResolvedValue({ id: 'm1' });
      await service.remove('m1');
      expect(prisma.contactMessage.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
    });
  });
});
