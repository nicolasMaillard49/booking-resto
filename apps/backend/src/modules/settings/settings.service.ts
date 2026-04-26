import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ALLOWED_KEYS, DEFAULTS, SettingKey } from './settings.constants';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<Record<SettingKey, string>> {
    const rows = await this.prisma.setting.findMany();
    const map: Record<string, string> = { ...DEFAULTS };
    for (const r of rows) {
      if ((ALLOWED_KEYS as readonly string[]).includes(r.key)) {
        map[r.key] = r.value;
      }
    }
    return map as Record<SettingKey, string>;
  }

  async get(key: SettingKey): Promise<string> {
    const all = await this.getAll();
    return all[key];
  }

  async updateMany(payload: Partial<Record<SettingKey, string>>) {
    for (const k of Object.keys(payload)) {
      if (!(ALLOWED_KEYS as readonly string[]).includes(k)) {
        throw new BadRequestException(`Clé non autorisée: ${k}`);
      }
    }
    await Promise.all(
      Object.entries(payload).map(([key, value]) =>
        this.prisma.setting.upsert({
          where: { key },
          update: { value: value ?? '' },
          create: { key, value: value ?? '' },
        }),
      ),
    );
  }

  // Typed getters (number)
  async getCapacityMax()            { return parseInt(await this.get('capacity_max'), 10); }
  async getDefaultMealDurationMin() { return parseInt(await this.get('default_meal_duration_min'), 10); }
  async getAutoConfirmThreshold()   { return parseInt(await this.get('auto_confirm_threshold'), 10); }
  async getLookaheadDays()          { return parseInt(await this.get('lookahead_days'), 10); }
  async getCutoffHours()            { return parseInt(await this.get('cutoff_hours'), 10); }
  async getSlotIntervalMin()        { return parseInt(await this.get('slot_interval_min'), 10); }
  async getWeekStartsOn()           { return parseInt(await this.get('week_starts_on'), 10); }

  // Typed getters (string)
  async getBrandName()          { return this.get('brand_name'); }
  async getHeroTitle()          { return this.get('hero_title'); }
  async getHeroSubtitle()       { return this.get('hero_subtitle'); }
  async getHeroImageId()        { return (await this.get('hero_image_id')) || null; }
  async getContactAddress()     { return this.get('contact_address'); }
  async getContactPhone()       { return this.get('contact_phone'); }
  async getContactEmail()       { return this.get('contact_email'); }
  async getGoogleMapsEmbedUrl() { return this.get('google_maps_embed_url'); }
  async getInstagramUrl()       { return this.get('instagram_url'); }
}
