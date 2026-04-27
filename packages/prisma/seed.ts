// ============================================================
// Seed — Booking Resto (template)
// Usage : pnpm --filter @booking-resto/prisma seed
// Crée un admin de démo + des paramètres par défaut + 2 sections d'exemple
// ============================================================
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SETTINGS_DEFAULTS: Array<[string, string]> = [
  // Réservations
  ['capacity_max', '30'],
  ['default_meal_duration_min', '90'],
  ['auto_confirm_threshold', '6'],
  ['lookahead_days', '90'],
  ['cutoff_hours', '2'],
  ['slot_interval_min', '15'],
  ['week_starts_on', '1'],
  // Identité
  ['brand_name', 'Mon Restaurant'],
  ['hero_title', 'Bienvenue'],
  ['hero_subtitle', 'Une cuisine de saison, des produits locaux'],
  ['hero_image_id', ''],
  ['contact_bg_image_id', ''],
  // Contact
  ['contact_address', '1 rue Exemple, 33000 Ville'],
  ['contact_phone', '05 00 00 00 00'],
  ['contact_email', 'contact@example.fr'],
  ['google_maps_embed_url', ''],
  // Réseaux sociaux
  ['instagram_url', ''],
  ['facebook_url', ''],
  ['tiktok_url', ''],
  ['twitter_url', ''],
  ['youtube_url', ''],
  ['tripadvisor_url', ''],
  ['thefork_url', ''],
  // Avis Google
  ['google_review_url', ''],
  ['rating_value', '5'],
  ['rating_count', '0'],
  // Page menu
  ['menu_page_title', 'Nos menus'],
  ['menu_page_description', ''],
  // Traduction auto (optionnel)
  ['deepl_api_key', ''],
  // SEO
  ['seo_home_title', ''],
  ['seo_home_description', ''],
  ['seo_menu_title', ''],
  ['seo_menu_description', ''],
];

async function main() {
  // Admin par défaut — à changer en prod !
  const passwordHash = await bcrypt.hash('Admin1234!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@example.fr' },
    update: {},
    create: { email: 'admin@example.fr', passwordHash, role: 'ADMIN' },
  });

  // Settings (idempotent : ne touche pas aux valeurs déjà saisies)
  for (const [key, value] of SETTINGS_DEFAULTS) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  // Plages de service de démo
  const existingWindows = await prisma.serviceWindow.count();
  if (existingWindows === 0) {
    await prisma.serviceWindow.createMany({
      data: [
        { label: 'Service Midi', daysOfWeek: [2, 3, 4, 5, 6], startTime: '12:00', endTime: '14:00', sortOrder: 0 },
        { label: 'Service Soir', daysOfWeek: [3, 4, 5, 6], startTime: '19:30', endTime: '21:15', sortOrder: 1 },
      ],
    });
  }

  // Sections d'accueil de démo (à éditer dans /admin/home)
  const existingSections = await prisma.homeSection.count();
  if (existingSections === 0) {
    await prisma.homeSection.createMany({
      data: [
        {
          title: 'Notre cuisine',
          body: 'Présentez votre approche culinaire ici : produits, saisons, philosophie. Ce texte se modifie depuis l\'administration → Page d\'accueil.',
          sortOrder: 0,
        },
        {
          title: 'Notre histoire',
          body: 'Racontez l\'histoire de votre maison, votre équipe, vos producteurs. Tout se personnalise depuis le panel admin.',
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
