import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ReorderServicesDto } from './dto/reorder-services.dto';

@ApiTags('services')
@Controller()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('services')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste admin des services (actifs + inactifs)' })
  findAll() {
    return this.servicesService.findAll();
  }

  @Post('services')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un service (admin)' })
  @ApiResponse({ status: 201, description: 'Service créé' })
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Patch('services/reorder')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Réordonner les services (admin)' })
  reorder(@Body() dto: ReorderServicesDto) {
    return this.servicesService.reorder(dto);
  }

  @Patch('services/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un service (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete('services/:id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Désactiver un service (admin)' })
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
