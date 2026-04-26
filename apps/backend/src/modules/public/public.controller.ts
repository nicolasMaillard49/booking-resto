import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SettingsService } from '../settings/settings.service';
import { ServiceWindowsService } from '../service-windows/service-windows.service';
import { HomeSectionsService } from '../home-sections/home-sections.service';
import { MenuDocumentsService } from '../menu-documents/menu-documents.service';
import { BookingsService } from '../bookings/bookings.service';
import { PUBLIC_KEYS } from '../settings/settings.constants';

@ApiTags('public')
@Public()
@Controller('public')
export class PublicController {
  constructor(
    private settings: SettingsService,
    private windows: ServiceWindowsService,
    private home: HomeSectionsService,
    private menu: MenuDocumentsService,
    private bookings: BookingsService,
  ) {}

  @Get('site')
  async getSite() {
    const all = await this.settings.getAll();
    const out: Record<string, string> = {};
    for (const k of PUBLIC_KEYS) out[k] = all[k];
    return out;
  }

  @Get('home-sections')
  getHomeSections() { return this.home.findPublished(); }

  @Get('menu-documents')
  getMenuDocuments() { return this.menu.findPublished(); }

  @Get('schedule')
  async getSchedule() {
    const all = await this.windows.findAll();
    return all.filter(w => w.isActive);
  }

  @Get('availability-slots')
  getSlots(@Query('date') date: string, @Query('partySize') partySize: string) {
    return this.bookings.generateSlots(date, parseInt(partySize, 10));
  }
}
