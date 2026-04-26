import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MenuDocumentsService } from './menu-documents.service';
import { CreateMenuDocumentDto } from './dto/create-menu-document.dto';
import { UpdateMenuDocumentDto } from './dto/update-menu-document.dto';
import { ReorderMenuDocumentsDto } from './dto/reorder.dto';

@ApiTags('admin/menu-documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/menu-documents')
export class MenuDocumentsController {
  constructor(private svc: MenuDocumentsService) {}
  @Get()             findAll()                                                                       { return this.svc.findAll(); }
  @Post()            create(@Body() dto: CreateMenuDocumentDto)                                      { return this.svc.create(dto); }
  @Patch('reorder')  reorder(@Body() dto: ReorderMenuDocumentsDto)                                   { return this.svc.reorder(dto.ids); }
  @Patch(':id')      update(@Param('id') id: string, @Body() dto: UpdateMenuDocumentDto)             { return this.svc.update(id, dto); }
  @Delete(':id')     remove(@Param('id') id: string)                                                 { return this.svc.remove(id); }
}
