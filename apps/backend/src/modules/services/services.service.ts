import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ReorderServicesDto } from './dto/reorder-services.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Liste admin — tous les services (actifs + inactifs) */
  async findAll() {
    return this.prisma.service.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  /** Liste publique des services actifs */
  async findPublic() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        category: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        name: dto.name,
        description: dto.description,
        duration: dto.duration,
        price: dto.price,
        category: dto.category,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.assertExists(id);
    return this.prisma.service.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.assertExists(id);
    // Soft delete: désactiver plutôt que supprimer (préserve l'historique des réservations)
    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async reorder(dto: ReorderServicesDto) {
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.service.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
    return { success: true };
  }

  private async assertExists(serviceId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException('Service introuvable');
    }
  }
}
