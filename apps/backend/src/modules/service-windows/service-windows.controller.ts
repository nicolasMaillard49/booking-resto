import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ServiceWindowsService } from './service-windows.service';
import { CreateServiceWindowDto } from './dto/create-service-window.dto';
import { UpdateServiceWindowDto } from './dto/update-service-window.dto';
import { ReorderDto } from './dto/reorder.dto';

@ApiTags('service-windows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('service-windows')
export class ServiceWindowsController {
  constructor(private svc: ServiceWindowsService) {}
  @Get()             findAll()                                                                       { return this.svc.findAll(); }
  @Post()            create(@Body() dto: CreateServiceWindowDto)                                     { return this.svc.create(dto); }
  @Patch('reorder')  reorder(@Body() dto: ReorderDto)                                                { return this.svc.reorder(dto.ids); }
  @Patch(':id')      update(@Param('id') id: string, @Body() dto: UpdateServiceWindowDto)            { return this.svc.update(id, dto); }
  @Delete(':id')     remove(@Param('id') id: string)                                                 { return this.svc.remove(id); }
}
