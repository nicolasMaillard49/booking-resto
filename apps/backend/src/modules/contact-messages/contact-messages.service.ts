import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CaptchaService } from './captcha.service';

@Injectable()
export class ContactMessagesService {
  constructor(private prisma: PrismaService, private notif: NotificationsService, private captcha: CaptchaService) {}

  async create(dto: { name: string; email: string; message: string; captchaToken: string; captchaAnswer: string }) {
    if (!this.captcha.verify(dto.captchaToken, dto.captchaAnswer)) {
      throw new BadRequestException('Captcha invalide');
    }
    const created = await this.prisma.contactMessage.create({
      data: { name: dto.name, email: dto.email, message: dto.message },
    });
    await this.notif.onContactMessage({ name: dto.name, email: dto.email, message: dto.message });
    return { id: created.id };
  }

  async findAll(page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      this.prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.contactMessage.count(),
    ]);
    return { items, total, page, pageSize };
  }

  async setRead(id: string, isRead: boolean) {
    try { return await this.prisma.contactMessage.update({ where: { id }, data: { isRead } }); }
    catch { throw new NotFoundException(); }
  }

  async remove(id: string) {
    try { return await this.prisma.contactMessage.delete({ where: { id } }); }
    catch { throw new NotFoundException(); }
  }
}
