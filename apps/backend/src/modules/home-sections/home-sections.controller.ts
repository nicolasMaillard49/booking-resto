import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HomeSectionsService } from './home-sections.service';
import { CreateHomeSectionDto } from './dto/create-home-section.dto';
import { UpdateHomeSectionDto } from './dto/update-home-section.dto';
import { ReorderHomeSectionsDto } from './dto/reorder.dto';

@ApiTags('admin/home-sections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/home-sections')
export class HomeSectionsController {
  constructor(private svc: HomeSectionsService) {}
  @Get()             findAll()                                                                       { return this.svc.findAll(); }
  @Post()            create(@Body() dto: CreateHomeSectionDto)                                       { return this.svc.create(dto); }
  @Patch('reorder')  reorder(@Body() dto: ReorderHomeSectionsDto)                                    { return this.svc.reorder(dto.ids); }
  @Patch(':id')      update(@Param('id') id: string, @Body() dto: UpdateHomeSectionDto)              { return this.svc.update(id, dto); }
  @Delete(':id')     remove(@Param('id') id: string)                                                 { return this.svc.remove(id); }
}
