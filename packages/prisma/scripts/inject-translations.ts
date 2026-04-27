/* Script d'exemple : injecte des traductions EN/ES/IT/DE pour les sections d'accueil
 * (en remplacement ou complément de la traduction auto via DeepL).
 *
 * Usage :
 *   1. Adapter le tableau DATA ci-dessous avec vos propres traductions.
 *      `idMatch` = bout de texte présent dans le titre FR (case-insensitive).
 *   2. Exécuter :
 *      DATABASE_URL="postgresql://..." npx ts-node scripts/inject-translations.ts
 *
 * Alternative recommandée : configurer une clé DeepL dans /admin/parametres
 * pour que le backend traduise automatiquement à chaque enregistrement.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Trans { title?: string; body?: string; ctaLabel?: string }
type AllTrans = { en?: Trans; es?: Trans; it?: Trans; de?: Trans };

const DATA: Array<{ idMatch: string; t: AllTrans }> = [
  // ─── Exemple : adapter avec vos propres traductions ──────────
  // {
  //   idMatch: 'Notre cuisine',
  //   t: {
  //     en: { title: 'Our cuisine', body: '<p>Seasonal cuisine made from local produce.</p>' },
  //     es: { title: 'Nuestra cocina', body: '<p>Cocina de temporada con productos locales.</p>' },
  //     it: { title: 'La nostra cucina', body: '<p>Cucina di stagione con prodotti locali.</p>' },
  //     de: { title: 'Unsere Küche', body: '<p>Saisonale Küche mit regionalen Produkten.</p>' },
  //   },
  // },
];

async function main() {
  if (DATA.length === 0) {
    console.log('Aucune traduction définie dans DATA — édite ce fichier puis relance.');
    return;
  }
  const sections = await prisma.homeSection.findMany();
  for (const section of sections) {
    const match = DATA.find(d => section.title.toLowerCase().includes(d.idMatch.toLowerCase()));
    if (!match) {
      console.log(`SKIP "${section.title}" (no translation defined)`);
      continue;
    }
    await prisma.homeSection.update({
      where: { id: section.id },
      data: { translations: match.t as any },
    });
    console.log(`✓ "${section.title}" → translations EN/ES/IT/DE injected`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
