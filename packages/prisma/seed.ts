// ============================================================
// Seed — Booking Resto
// Usage: pnpm --filter @booking-resto/prisma seed
// ============================================================
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SETTINGS_DEFAULTS: Array<[string, string]> = [
  ['capacity_max', '30'],
  ['default_meal_duration_min', '90'],
  ['auto_confirm_threshold', '6'],
  ['lookahead_days', '90'],
  ['cutoff_hours', '2'],
  ['slot_interval_min', '15'],
  ['week_starts_on', '1'],
  ['brand_name', 'Mon Restaurant'],
  ['hero_title', 'Bienvenue chez Mon Restaurant'],
  ['hero_subtitle', 'Une cuisine de saison, des produits locaux'],
  ['hero_image_id', ''],
  ['contact_address', '1 rue Exemple, 33000 Bordeaux'],
  ['contact_phone', '05 00 00 00 00'],
  ['contact_email', 'contact@example.fr'],
  ['google_maps_embed_url', ''],
  ['instagram_url', ''],
  ['seo_home_title', 'Mon Restaurant — Cuisine de saison à Bordeaux'],
  ['seo_home_description', 'Restaurant gastronomique au cœur de Bordeaux.'],
  ['seo_menu_title', 'Nos menus — Mon Restaurant'],
  ['seo_menu_description', 'Découvrez nos menus midi, soir et notre carte.'],
];

async function main() {
  // Admin
  const passwordHash = await bcrypt.hash('Admin1234!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@example.fr' },
    update: {},
    create: { email: 'admin@example.fr', passwordHash, role: 'ADMIN' },
  });

  // Settings (idempotent)
  for (const [key, value] of SETTINGS_DEFAULTS) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  // Service Windows
  const existingWindows = await prisma.serviceWindow.count();
  if (existingWindows === 0) {
    await prisma.serviceWindow.createMany({
      data: [
        { label: 'Service Midi', daysOfWeek: [2, 3, 4, 5, 6], startTime: '12:00', endTime: '14:00', sortOrder: 0 },
        { label: 'Service Soir', daysOfWeek: [3, 4, 5, 6], startTime: '19:30', endTime: '21:15', sortOrder: 1 },
      ],
    });
  }

  // Home Sections
  const existingSections = await prisma.homeSection.count();
  if (existingSections === 0) {
    await prisma.homeSection.createMany({
      data: [
        {
          title: 'Notre cuisine',
          body: "Une cuisine de saison, élaborée à partir de produits locaux et bio. Chaque plat est pensé comme une rencontre entre la tradition et la créativité.",
          sortOrder: 0,
        },
        {
          title: 'Notre histoire',
          body: 'Depuis 2020, nous travaillons main dans la main avec les producteurs de la région pour vous offrir une expérience unique à chaque service.',
          sortOrder: 1,
        },
      ],
    });
  }

  console.log('Seed terminé.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
