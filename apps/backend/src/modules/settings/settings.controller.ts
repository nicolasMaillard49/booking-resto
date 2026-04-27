import { Body, Controller, Get, Put, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { SettingKey } from './settings.constants';

@ApiTags('admin/settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/settings')
export class SettingsController {
  constructor(private settings: SettingsService) {}

  @Get()
  getAll() {
    return this.settings.getAll();
  }

  /**
   * Override le ValidationPipe global (forbidNonWhitelisted: true) pour cet endpoint :
   * le body est un Record dynamique de Settings, pas un DTO fixe. La whitelist est
   * appliquée par SettingsService.updateMany() qui rejette toute clé hors ALLOWED_KEYS.
   */
  @Put()
  @UsePipes(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: true }))
  async updateMany(@Body() body: Record<string, string>) {
    await this.settings.updateMany(body as Partial<Record<SettingKey, string>>);
    return this.settings.getAll();
  }
}
