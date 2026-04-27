export type SettingKey =
  | 'capacity_max'
  | 'default_meal_duration_min'
  | 'auto_confirm_threshold'
  | 'lookahead_days'
  | 'cutoff_hours'
  | 'slot_interval_min'
  | 'week_starts_on'
  | 'brand_name'
  | 'hero_title'
  | 'hero_subtitle'
  | 'hero_image_id'
  | 'contact_bg_image_id'
  | 'contact_address'
  | 'contact_phone'
  | 'contact_email'
  | 'google_maps_embed_url'
  | 'instagram_url'
  | 'seo_home_title'
  | 'seo_home_description'
  | 'seo_menu_title'
  | 'seo_menu_description';

export const ALLOWED_KEYS: readonly SettingKey[] = [
  'capacity_max', 'default_meal_duration_min', 'auto_confirm_threshold',
  'lookahead_days', 'cutoff_hours', 'slot_interval_min', 'week_starts_on',
  'brand_name', 'hero_title', 'hero_subtitle', 'hero_image_id',
  'contact_bg_image_id',
  'contact_address', 'contact_phone', 'contact_email',
  'google_maps_embed_url', 'instagram_url',
  'seo_home_title', 'seo_home_description',
  'seo_menu_title', 'seo_menu_description',
] as const;

export const DEFAULTS: Record<SettingKey, string> = {
  capacity_max: '30',
  default_meal_duration_min: '90',
  auto_confirm_threshold: '6',
  lookahead_days: '90',
  cutoff_hours: '2',
  slot_interval_min: '15',
  week_starts_on: '1',
  brand_name: 'Mon Restaurant',
  hero_title: 'Bienvenue chez Mon Restaurant',
  hero_subtitle: 'Une cuisine de saison, des produits locaux',
  hero_image_id: '',
  contact_bg_image_id: '',
  contact_address: '',
  contact_phone: '',
  contact_email: '',
  google_maps_embed_url: '',
  instagram_url: '',
  seo_home_title: '',
  seo_home_description: '',
  seo_menu_title: '',
  seo_menu_description: '',
};

export const PUBLIC_KEYS: readonly SettingKey[] = [
  'brand_name', 'hero_title', 'hero_subtitle', 'hero_image_id',
  'contact_bg_image_id',
  'contact_address', 'contact_phone', 'contact_email',
  'google_maps_embed_url', 'instagram_url',
  'seo_home_title', 'seo_home_description', 'seo_menu_title', 'seo_menu_description',
] as const;
