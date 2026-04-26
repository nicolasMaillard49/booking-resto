import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Avis approuvés publics */
  async findPublic() {
    return this.prisma.review.findMany({
      where: { isApproved: true },
      select: {
        id: true,
        author: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async create(dto: CreateReviewDto) {
    return this.prisma.review.create({
      data: {
        author: dto.author,
        rating: dto.rating,
        comment: dto.comment,
        isApproved: false, // Modération manuelle
      },
    });
  }

  /** Tous les avis pour la modération admin */
  async findAllAdmin(isApproved?: boolean) {
    const where: Record<string, unknown> = {};
    if (isApproved !== undefined) {
      where.isApproved = isApproved;
    }

    return this.prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async moderate(id: string, isApproved: boolean) {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundException('Avis introuvable');
    }

    return this.prisma.review.update({
      where: { id },
      data: { isApproved },
    });
  }
}
