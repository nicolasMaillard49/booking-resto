import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ImageSection } from '@prisma/client';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ImagesService } from './images.service';
import { UpdateImageDto } from './dto/update-image.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';

const VALID_SECTIONS = new Set<string>(['HERO', 'HOMESECTION', 'MENU', 'OTHER']);

function parseSection(value: string | undefined): ImageSection {
  if (!value || !VALID_SECTIONS.has(value)) {
    throw new BadRequestException(`section invalide (attendu: HERO|HOMESECTION|MENU|OTHER)`);
  }
  return value as ImageSection;
}

@ApiTags('images')
@Controller()
export class ImagesController {
  constructor(private images: ImagesService) {}

  @Public()
  @Get('images/:id')
  async serve(@Param('id') id: string, @Res() res: Response) {
    const img = await this.images.getRaw(id);
    res.setHeader('Content-Type', img.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (img.mimeType === 'application/pdf') {
      res.setHeader('Content-Disposition', `inline; filename="document-${id}.pdf"`);
    }
    res.send(img.data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post('admin/images')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('section') section: string,
    @Body('caption') caption?: string,
    @Body('width') width?: string,
    @Body('height') height?: string,
  ) {
    return this.images.upload({
      section: parseSection(section),
      mimeType: file.mimetype,
      size: file.size,
      buffer: file.buffer,
      caption,
      width: width ? parseInt(width, 10) : undefined,
      height: height ? parseInt(height, 10) : undefined,
    });
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get('admin/images')
  list(@Query('section') section: string) {
    return this.images.findBySection(parseSection(section));
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch('admin/images/reorder')
  reorder(@Body() dto: ReorderImagesDto) { return this.images.reorder(dto.ids); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch('admin/images/:id')
  update(@Param('id') id: string, @Body() dto: UpdateImageDto) { return this.images.update(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Delete('admin/images/:id')
  remove(@Param('id') id: string) { return this.images.remove(id); }
}
