import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PopupsService } from './popups.service';
import { CreatePopupDto } from './dto/create-popup.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';

@ApiTags('popups')
@Controller()
export class PopupsController {
  constructor(private popups: PopupsService) {}

  // ── Public ──
  @Public()
  @Get('public/popup')
  async active() {
    const p = await this.popups.findActive();
    return p;
  }

  // ── Admin ──
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get('admin/popups')
  list() { return this.popups.findAll(); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post('admin/popups')
  create(@Body() dto: CreatePopupDto) {
    const { imageId, startDate, endDate, ...rest } = dto;
    return this.popups.create({
      ...rest,
      ...(imageId ? { image: { connect: { id: imageId } } } : {}),
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(endDate ? { endDate: new Date(endDate) } : {}),
    });
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch('admin/popups/:id')
  update(@Param('id') id: string, @Body() dto: UpdatePopupDto) {
    const { imageId, startDate, endDate, ...rest } = dto;
    const data: Record<string, unknown> = { ...rest };
    if ('imageId' in dto) {
      data.image = imageId ? { connect: { id: imageId } } : { disconnect: true };
    }
    if ('startDate' in dto) data.startDate = startDate ? new Date(startDate) : null;
    if ('endDate' in dto) data.endDate = endDate ? new Date(endDate) : null;
    return this.popups.update(id, data);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Delete('admin/popups/:id')
  remove(@Param('id') id: string) { return this.popups.remove(id); }
}
