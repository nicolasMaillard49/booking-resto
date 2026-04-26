# Booking-Resto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Forker le template `booking-pro` vers un nouveau repo `booking-resto`, template générique restaurant avec réservation table-only (couverts), schedule multi-window, page d'accueil éditoriale dynamique, page menu (image/PDF), formulaire de contact, et auto-confirm sous seuil.

**Architecture:** Monorepo pnpm (NestJS 10 backend + Nuxt 3 frontend + Prisma 5 + PostgreSQL 16, mono-tenant mono-vertical). Schema Prisma réécrit (drop `Service`/`Availability`/`BlockedSlot`/`Review`, add `ServiceWindow`/`ScheduleException`/`HomeSection`/`MenuDocument`/`ContactMessage`/`Setting`). 10 modules backend, 17 pages frontend (4 publiques + 9 admin + 4 token). Mailer abstrait : Nodemailer dev / Resend SDK prod. Cron J-1 pour rappels.

**Tech Stack:** NestJS 10, Nuxt 3.12, Vue 3.4, TypeScript 5.4 strict, Prisma 5, PostgreSQL 16 (`bytea` pour images/PDFs), TailwindCSS 3.4, Jest, Resend SDK, Nodemailer, `@nestjs/schedule`, `@nestjs/throttler`, `class-validator`, `file-type` (magic-bytes), `helmet`, JWT + bcrypt, pnpm 9 workspaces, Node ≥ 20, Docker compose (Postgres 5440 + MailHog 8025).

**Reference spec:** `docs/superpowers/specs/2026-04-26-booking-resto-design.md` (657 lignes, 16 sections).

---

## Working Directory Convention

- **Tasks `M0.1` à `M0.4`** : exécuter depuis `D:\projets\booking-pro` (ou n'importe quel cwd) — opèrent sur le clone naissant.
- **Tasks `M0.5` et après** : exécuter depuis `D:\projets\booking-resto` (le nouveau repo). Tous les chemins relatifs sont relatifs à ce répertoire.

## File Structure (final state, après tous les milestones)

```
D:\projets\booking-resto/
├── apps/
│   ├── backend/
│   │   └── src/
│   │       ├── main.ts                         # héritage adapté (logger, helmet, CORS, validation pipe, swagger)
│   │       ├── app.module.ts                   # module racine, wire tous les feature modules
│   │       ├── prisma/prisma.service.ts        # héritage
│   │       ├── common/                         # héritage intégral (decorators, filters, guards, interceptors)
│   │       └── modules/
│   │           ├── auth/                       # héritage intégral
│   │           ├── bookings/                   # ADAPTÉ : partySize, drop serviceId, add serviceWindowId/notes
│   │           ├── service-windows/            # NOUVEAU
│   │           ├── schedule-exceptions/        # NOUVEAU
│   │           ├── home-sections/              # NOUVEAU
│   │           ├── menu-documents/             # NOUVEAU
│   │           ├── contact-messages/           # NOUVEAU (avec captcha service)
│   │           ├── settings/                   # NOUVEAU (whitelist + typed getters)
│   │           ├── images/                     # ÉTENDU : accept PDF, 5 Mo, magic-bytes
│   │           ├── notifications/              # ADAPTÉ : MailerService abstrait + 9 templates + cron J-1
│   │           ├── public/                     # ADAPTÉ : nouveaux endpoints (site, home-sections, menu-documents, availability-slots, schedule)
│   │           └── stats/                      # ADAPTÉ : couverts au lieu de RDV
│   └── frontend/
│       ├── pages/
│       │   ├── index.vue                       # accueil éditorial
│       │   ├── menu/index.vue                  # liste verticale MenuDocuments
│       │   ├── reservation/
│       │   │   ├── index.vue                   # tunnel 1-page (ssr:false)
│       │   │   └── [token]/cancel.vue, confirm.vue
│       │   └── admin/
│       │       ├── login.vue                   # héritage
│       │       ├── index.vue                   # dashboard couverts
│       │       ├── reservations/index.vue      # liste + agenda semaine
│       │       ├── horaires/index.vue          # ServiceWindows + Exceptions combinés
│       │       ├── home/index.vue              # éditeur HomeSections (drag, modal CRUD)
│       │       ├── menu/index.vue              # éditeur MenuDocuments (drag, modal CRUD)
│       │       ├── messages/index.vue          # boîte ContactMessages
│       │       ├── images/index.vue            # galerie filtrée par section
│       │       └── parametres/index.vue        # tous Settings, bulk save
│       ├── components/
│       │   ├── public/{Hero,HomeSection,ContactBlock,ContactForm,ScheduleDisplay}.vue
│       │   └── admin/{ServiceWindowForm,ScheduleExceptionForm,HomeSectionForm,MenuDocumentForm,ContactMessageDrawer,StatCard,WeekAgendaCard}.vue
│       ├── composables/{useAuth,useToast,useImageUpload,useSettings,useReservationFlow}.ts
│       ├── layouts/{default,admin,admin-auth}.vue
│       └── middleware/admin-auth.ts
├── packages/
│   ├── prisma/
│   │   ├── schema.prisma                       # nouveau schema (cf. spec §4)
│   │   ├── seed.ts                             # admin + settings + 2 windows + 2 sections (cf. spec §12)
│   │   └── migrations/<ts>_init/migration.sql  # init unique
│   └── shared/src/index.ts                     # types DTO/entity partagés
├── docker-compose.yml                          # Postgres 5440 + MailHog 8025 (renommé booking_resto_*)
├── .env.example                                # avec RESEND_API_KEY, MAIL_FROM, ADMIN_EMAIL, TZ
├── package.json                                # name: booking-resto
├── pnpm-workspace.yaml
├── README.md                                   # nouveau contenu resto
├── CLAUDE.md                                   # mono-vertical resto
└── .github/workflows/ci.yml                    # héritage adapté
```

---

## Milestone 0 — Setup repo (8 tâches)

**Output testable :** `pnpm dev` démarre backend (3101) + frontend (3100), Postgres prêt, schema vide, login admin fonctionne.

### Task M0.1: Cloner le template et détacher du remote

**Files:**
- N/A (opérations git)

- [ ] **Step 1: Vérifier que la cible n'existe pas**

```bash
test ! -d /d/projets/booking-resto && echo OK || echo "ERREUR: booking-resto existe déjà"
```
Expected: `OK`

- [ ] **Step 2: Cloner**

```bash
git clone /d/projets/booking-pro /d/projets/booking-resto
cd /d/projets/booking-resto
```
Expected: `Cloning into '/d/projets/booking-resto'... done.`

- [ ] **Step 3: Détacher du remote source**

```bash
git remote remove origin
git remote -v
```
Expected: aucune sortie (plus de remote)

- [ ] **Step 4: Reset historique (template propre)**

```bash
rm -rf .git
git init -b main
```
Expected: `Initialized empty Git repository in D:/projets/booking-resto/.git/`

### Task M0.2: Premier commit "fork from booking-pro"

**Files:**
- N/A

- [ ] **Step 1: Stage tout**

```bash
git add -A
```

- [ ] **Step 2: Premier commit**

```bash
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "chore: initial fork from booking-pro template"
```
Expected: `[main (root-commit) <hash>] chore: initial fork from booking-pro template`

### Task M0.3: Renommer le projet (root + workspaces + docker)

**Files:**
- Modify: `package.json` (root)
- Modify: `apps/backend/package.json`
- Modify: `apps/frontend/package.json`
- Modify: `packages/prisma/package.json`
- Modify: `packages/shared/package.json`
- Modify: `docker-compose.yml`
- Modify: `.env.example`
- Modify: `apps/backend/.env` (si existant)

- [ ] **Step 1: Renommer dans tous les `package.json`**

Dans chaque `package.json` listé dans Files :
- Remplacer `"name": "booking-pro"` → `"name": "booking-resto"`
- Remplacer `"name": "@booking-pro/prisma"` → `"name": "@booking-resto/prisma"`
- Remplacer `"name": "@booking-pro/shared"` → `"name": "@booking-resto/shared"`
- Remplacer toute dépendance `"@booking-pro/prisma"` → `"@booking-resto/prisma"` et idem pour `shared`

- [ ] **Step 2: Remplacer dans tout le code source les imports `@booking-pro/*`**

```bash
grep -rl "@booking-pro/" apps packages | xargs sed -i 's|@booking-pro/|@booking-resto/|g'
```
Expected: aucune erreur, plusieurs fichiers modifiés

- [ ] **Step 3: Renommer Docker**

Dans `docker-compose.yml` :
- `container_name: booking_pro_db` → `booking_resto_db`
- `container_name: booking_pro_mail` → `booking_resto_mail`
- DB name `booking_pro` → `booking_resto`
- DB user reste `booking` / password reste `booking123` (ou changer si volonté)

- [ ] **Step 4: Renommer DB dans `.env.example` et `apps/backend/.env`**

Remplacer `booking_pro` → `booking_resto` dans les `DATABASE_URL`.

- [ ] **Step 5: Vérifier qu'aucune ref `booking-pro` ne traîne dans le code**

```bash
grep -rn "booking-pro\|booking_pro" apps packages docker-compose.yml package.json
```
Expected: aucune sortie (ou seulement dans `docs/` si on garde des refs historiques au repo parent — OK)

- [ ] **Step 6: Commit**

```bash
git add -A
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "chore: rename booking-pro -> booking-resto"
```

### Task M0.4: Créer le repo GitHub et push

**Files:**
- N/A

- [ ] **Step 1: Créer le repo distant**

```bash
gh repo create nicolasMaillard49/booking-resto --private --source=. --remote=origin --push
```
Expected: création + push réussis

- [ ] **Step 2: Vérifier**

```bash
git remote -v
git log --oneline
```
Expected: `origin git@github.com:nicolasMaillard49/booking-resto.git ...` + 2 commits

### Task M0.5: Démarrer Postgres + MailHog et installer les deps

**Files:**
- N/A (commandes)

- [ ] **Step 1: Démarrer les services Docker**

```bash
COMPOSE_PROJECT_NAME=booking-resto docker compose up postgres mailhog -d
```
Expected: containers `booking_resto_db` et `booking_resto_mail` running

- [ ] **Step 2: Vérifier que Postgres répond**

```bash
docker exec booking_resto_db pg_isready -U booking
```
Expected: `accepting connections`

- [ ] **Step 3: Installer les dépendances**

```bash
pnpm install
```
Expected: install OK

### Task M0.6: Reset historique des migrations Prisma

**Files:**
- Delete: `packages/prisma/migrations/*`

- [ ] **Step 1: Supprimer les anciennes migrations**

```bash
rm -rf packages/prisma/migrations
```
Expected: dossier disparu

- [ ] **Step 2: Commit**

```bash
git add -A
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "chore(db): reset migrations history before resto schema"
```

### Task M0.7: Vérifier le build du shared package

**Files:**
- N/A

- [ ] **Step 1: Builder le package shared**

```bash
pnpm --filter shared build
```
Expected: `dist/` produit, exit 0

### Task M0.8: Smoke test "le projet démarre sans erreur"

**Files:**
- N/A

À ce stade, le code source contient encore les anciens modules booking-pro (`Service`, `Availability`, etc.). On NE démarre PAS encore le backend (le schema Prisma sera réécrit en M1). On vérifie juste que :

- [ ] **Step 1: Le frontend démarre seul**

```bash
pnpm --filter frontend dev &
sleep 15
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3100/
kill %1
```
Expected: `200` ou `500` (le 500 est OK ici si le frontend tape sur des endpoints absents — l'important est que le serveur Vite démarre).

- [ ] **Step 2: Marquer M0 fait dans un commit symbolique**

```bash
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit --allow-empty -m "milestone(M0): repo setup done"
```

---

## Milestone 1 — Schema + Settings + Auth (7 tâches)

**Output testable :** `prisma migrate dev` réussit avec le nouveau schema, `prisma db seed` peuple les données minimales, `pnpm --filter backend test` passe sur Auth + Settings, `POST /auth/login` fonctionne.

### Task M1.1: Réécrire `packages/prisma/schema.prisma`

**Files:**
- Modify (rewrite complete): `packages/prisma/schema.prisma`

- [ ] **Step 1: Remplacer intégralement le contenu**

Remplacer tout le fichier `packages/prisma/schema.prisma` par le bloc défini dans **spec §4** (modèles : `Booking`, `ServiceWindow`, `ScheduleException`, `HomeSection`, `MenuDocument`, `ContactMessage`, `Image`, `Setting`, `User` + enums `BookingStatus`, `UserRole`, `ImageSection`).

- [ ] **Step 2: Générer le client Prisma**

```bash
cd packages/prisma && DATABASE_URL="postgresql://booking:booking123@localhost:5440/booking_resto" npx prisma generate
cd ../..
```
Expected: `Generated Prisma Client (...)`

- [ ] **Step 3: Commit (schema only, pas encore de migration)**

```bash
git add packages/prisma/schema.prisma
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(db): rewrite schema for resto vertical"
```

### Task M1.2: Créer la migration init

**Files:**
- Create: `packages/prisma/migrations/<timestamp>_init/migration.sql`

- [ ] **Step 1: Drop la base existante (résidu booking-pro éventuel)**

```bash
docker exec -e PGPASSWORD=booking123 booking_resto_db psql -U booking -d postgres -c "DROP DATABASE IF EXISTS booking_resto;"
docker exec -e PGPASSWORD=booking123 booking_resto_db psql -U booking -d postgres -c "CREATE DATABASE booking_resto;"
```
Expected: `DROP DATABASE` puis `CREATE DATABASE`

- [ ] **Step 2: Générer la migration init**

```bash
cd packages/prisma && DATABASE_URL="postgresql://booking:booking123@localhost:5440/booking_resto" npx prisma migrate dev --name init
cd ../..
```
Expected: `The following migration(s) have been created and applied`

- [ ] **Step 3: Commit la migration**

```bash
git add packages/prisma/migrations
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(db): init migration"
```

### Task M1.3: Réécrire le seed

**Files:**
- Modify (rewrite): `packages/prisma/seed.ts`

- [ ] **Step 1: Remplacer le contenu de `seed.ts`**

```ts
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

  // Settings (idempotent : ne touche pas une clé déjà présente)
  for (const [key, value] of SETTINGS_DEFAULTS) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  // Service Windows (skip si déjà des windows existent)
  const existing = await prisma.serviceWindow.count();
  if (existing === 0) {
    await prisma.serviceWindow.createMany({
      data: [
        { label: 'Service Midi', daysOfWeek: [2, 3, 4, 5, 6], startTime: '12:00', endTime: '14:00', sortOrder: 0 },
        { label: 'Service Soir', daysOfWeek: [3, 4, 5, 6],    startTime: '19:30', endTime: '21:15', sortOrder: 1 },
      ],
    });
  }

  // Home Sections (skip si déjà des sections existent)
  const existingSections = await prisma.homeSection.count();
  if (existingSections === 0) {
    await prisma.homeSection.createMany({
      data: [
        { title: 'Notre cuisine',  body: 'Une cuisine de saison, élaborée à partir de produits locaux et bio. Chaque plat est pensé comme une rencontre entre la tradition et la créativité.', sortOrder: 0 },
        { title: 'Notre histoire', body: 'Depuis 2020, nous travaillons main dans la main avec les producteurs de la région pour vous offrir une expérience unique à chaque service.',          sortOrder: 1 },
      ],
    });
  }

  console.log('Seed terminé.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Lancer le seed**

```bash
cd packages/prisma && DATABASE_URL="postgresql://booking:booking123@localhost:5440/booking_resto" npx prisma db seed
cd ../..
```
Expected: `Seed terminé.`

- [ ] **Step 3: Vérifier en DB**

```bash
docker exec -e PGPASSWORD=booking123 booking_resto_db psql -U booking -d booking_resto -c "SELECT key, value FROM settings ORDER BY key;"
```
Expected: 20 lignes de settings.

- [ ] **Step 4: Commit**

```bash
git add packages/prisma/seed.ts
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(db): seed admin + settings + 2 windows + 2 home sections"
```

### Task M1.4: Drop des anciens modules backend incompatibles

**Files:**
- Delete: `apps/backend/src/modules/services/`
- Delete: `apps/backend/src/modules/availability/`
- Delete: `apps/backend/src/modules/reviews/`

- [ ] **Step 1: Supprimer les modules**

```bash
rm -rf apps/backend/src/modules/services
rm -rf apps/backend/src/modules/availability
rm -rf apps/backend/src/modules/reviews
```

- [ ] **Step 2: Retirer leurs imports de `app.module.ts`**

Ouvrir `apps/backend/src/modules/app.module.ts` (ou `apps/backend/src/app.module.ts`). Supprimer toute ligne `import` faisant référence à `ServicesModule`, `AvailabilityModule`, `ReviewsModule`. Retirer ces noms de l'array `imports: []`.

- [ ] **Step 3: Idem dans `public.module.ts` et `public.controller.ts`**

Retirer toute injection/import de `ServicesService`, `AvailabilityService`, `ReviewsService`. Commenter temporairement les routes publiques qui en dépendent (elles seront réécrites en M6).

- [ ] **Step 4: Nettoyer `bookings.service.ts`** (drop refs à Service)

Dans `apps/backend/src/modules/bookings/bookings.service.ts` : supprimer toute référence à `Service`, `serviceId`, `service.duration`, `service.price`. Le fichier sera entièrement réécrit en M2 — pour l'instant, juste virer les imports cassés pour que le projet compile.

Si plus simple : **vider le contenu du fichier** et laisser `export class BookingsService {}` (stub, sera réimplémenté en M2).

- [ ] **Step 5: Vérifier que ça build**

```bash
pnpm --filter backend build
```
Expected: build OK (warnings tolérés, erreurs interdites)

- [ ] **Step 6: Commit**

```bash
git add -A
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "chore(backend): drop services/availability/reviews modules (incompat resto schema)"
```

### Task M1.5: Créer le module Settings — constants

**Files:**
- Create: `apps/backend/src/modules/settings/settings.constants.ts`

- [ ] **Step 1: Créer les constantes whitelist + defaults + types**

```ts
// apps/backend/src/modules/settings/settings.constants.ts

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

// Settings exposées au public via /public/site (pas tous les settings)
export const PUBLIC_KEYS: readonly SettingKey[] = [
  'brand_name', 'hero_title', 'hero_subtitle', 'hero_image_id',
  'contact_address', 'contact_phone', 'contact_email',
  'google_maps_embed_url', 'instagram_url',
  'seo_home_title', 'seo_home_description', 'seo_menu_title', 'seo_menu_description',
] as const;
```

### Task M1.6: SettingsService — TDD

**Files:**
- Create: `apps/backend/src/modules/settings/settings.service.ts`
- Create: `apps/backend/src/modules/settings/settings.service.spec.ts`

- [ ] **Step 1: Écrire les tests d'abord**

```ts
// apps/backend/src/modules/settings/settings.service.spec.ts
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from './settings.service';
import { DEFAULTS } from './settings.constants';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: { setting: { findMany: jest.Mock; upsert: jest.Mock } };

  beforeEach(async () => {
    prisma = { setting: { findMany: jest.fn(), upsert: jest.fn() } };
    const moduleRef = await Test.createTestingModule({
      providers: [SettingsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(SettingsService);
  });

  describe('getAll', () => {
    it('renvoie les settings DB superposés sur les defaults', async () => {
      prisma.setting.findMany.mockResolvedValue([
        { key: 'capacity_max', value: '50' },
        { key: 'brand_name',   value: 'La Rencontre' },
      ]);
      const all = await service.getAll();
      expect(all.capacity_max).toBe('50');
      expect(all.brand_name).toBe('La Rencontre');
      expect(all.lookahead_days).toBe(DEFAULTS.lookahead_days); // fallback
    });
  });

  describe('typed getters', () => {
    beforeEach(() => prisma.setting.findMany.mockResolvedValue([
      { key: 'capacity_max', value: '40' },
      { key: 'auto_confirm_threshold', value: '8' },
      { key: 'brand_name', value: 'Test Resto' },
    ]));

    it('getCapacityMax cast en number', async () => {
      expect(await service.getCapacityMax()).toBe(40);
    });
    it('getAutoConfirmThreshold cast en number', async () => {
      expect(await service.getAutoConfirmThreshold()).toBe(8);
    });
    it('getBrandName renvoie string', async () => {
      expect(await service.getBrandName()).toBe('Test Resto');
    });
  });

  describe('updateMany', () => {
    it('rejette les clés non whitelistées', async () => {
      await expect(service.updateMany({ malicious_key: 'x' } as any))
        .rejects.toThrow(/non autoris/);
    });

    it('upsert chaque clé valide', async () => {
      prisma.setting.upsert.mockResolvedValue({});
      await service.updateMany({ capacity_max: '50', brand_name: 'X' });
      expect(prisma.setting.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: 'capacity_max' },
        update: { value: '50' },
        create: { key: 'capacity_max', value: '50' },
      });
    });
  });
});
```

- [ ] **Step 2: Vérifier que les tests échouent**

```bash
pnpm --filter backend test -- settings.service.spec.ts
```
Expected: FAIL "Cannot find module './settings.service'"

- [ ] **Step 3: Implémenter `SettingsService`**

```ts
// apps/backend/src/modules/settings/settings.service.ts
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
      if (ALLOWED_KEYS.includes(r.key as SettingKey)) {
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
      if (!ALLOWED_KEYS.includes(k as SettingKey)) {
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
  async getCapacityMax()           { return parseInt(await this.get('capacity_max'), 10); }
  async getDefaultMealDurationMin(){ return parseInt(await this.get('default_meal_duration_min'), 10); }
  async getAutoConfirmThreshold()  { return parseInt(await this.get('auto_confirm_threshold'), 10); }
  async getLookaheadDays()         { return parseInt(await this.get('lookahead_days'), 10); }
  async getCutoffHours()           { return parseInt(await this.get('cutoff_hours'), 10); }
  async getSlotIntervalMin()       { return parseInt(await this.get('slot_interval_min'), 10); }
  async getWeekStartsOn()          { return parseInt(await this.get('week_starts_on'), 10); }

  // Typed getters (string)
  async getBrandName()             { return this.get('brand_name'); }
  async getHeroTitle()             { return this.get('hero_title'); }
  async getHeroSubtitle()          { return this.get('hero_subtitle'); }
  async getHeroImageId()           { return (await this.get('hero_image_id')) || null; }
  async getContactAddress()        { return this.get('contact_address'); }
  async getContactPhone()          { return this.get('contact_phone'); }
  async getContactEmail()          { return this.get('contact_email'); }
  async getGoogleMapsEmbedUrl()    { return this.get('google_maps_embed_url'); }
  async getInstagramUrl()          { return this.get('instagram_url'); }
}
```

- [ ] **Step 4: Vérifier que les tests passent**

```bash
pnpm --filter backend test -- settings.service.spec.ts
```
Expected: PASS (toutes les it())

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/settings/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(settings): service avec whitelist + typed getters + tests"
```

### Task M1.7: SettingsController + module + intégration

**Files:**
- Create: `apps/backend/src/modules/settings/settings.controller.ts`
- Create: `apps/backend/src/modules/settings/settings.module.ts`
- Create: `apps/backend/src/modules/settings/dto/update-settings.dto.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 1: DTO**

```ts
// apps/backend/src/modules/settings/dto/update-settings.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  // Tout est string, validation par clé déléguée à SettingsService.updateMany
  // (whitelist) — on accepte n'importe quel set de string pour rester flexible
  // mais SettingsService rejette les clés non listées.
  [key: string]: string | undefined;
}
```

- [ ] **Step 2: Controller**

```ts
// apps/backend/src/modules/settings/settings.controller.ts
import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

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

  @Put()
  async updateMany(@Body() dto: UpdateSettingsDto) {
    await this.settings.updateMany(dto as any);
    return this.settings.getAll();
  }
}
```

- [ ] **Step 3: Module**

```ts
// apps/backend/src/modules/settings/settings.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [PrismaModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
```

- [ ] **Step 4: Wire dans `app.module.ts`**

Ajouter dans les imports : `import { SettingsModule } from './modules/settings/settings.module';` et inclure `SettingsModule` dans l'array `imports: []`.

- [ ] **Step 5: Smoke test du backend**

```bash
pnpm --filter backend dev &
sleep 10
TOKEN=$(curl -s -X POST http://localhost:3101/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@example.fr","password":"Admin1234!"}' | jq -r '.data.accessToken')
curl -s http://localhost:3101/admin/settings -H "Authorization: Bearer $TOKEN" | jq '.data.brand_name'
kill %1
```
Expected: `"Mon Restaurant"`

- [ ] **Step 6: Commit + milestone tag**

```bash
git add -A
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(settings): controller + module + wired in app"
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit --allow-empty -m "milestone(M1): schema + settings + auth verified"
```

---

## Milestone 2 — Bookings core backend (12 tâches)

**Output testable :** `POST /bookings` crée une résa (auto-confirm ≤6, PENDING au-delà), refuse si capacité dépassée, génère cancelToken. `GET /public/availability-slots` renvoie les slots dispos pour une date+nb couverts. Admin peut lister/PATCH/DELETE.

### Task M2.1: DTOs Bookings

**Files:**
- Create: `apps/backend/src/modules/bookings/dto/create-booking.dto.ts`
- Create: `apps/backend/src/modules/bookings/dto/update-booking.dto.ts`
- Modify: `apps/backend/src/modules/bookings/dto/get-bookings-query.dto.ts`

- [ ] **Step 1: CreateBookingDto**

```ts
// apps/backend/src/modules/bookings/dto/create-booking.dto.ts
import { IsEmail, IsInt, IsISO8601, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';

export class CreateBookingDto {
  @IsInt() @Min(1) @Max(50)
  partySize!: number;

  @IsISO8601()
  date!: string;            // ISO datetime UTC

  @IsString() @Length(2, 80)
  clientName!: string;

  @IsEmail()
  clientEmail!: string;

  @IsString() @Matches(/^[+0-9 .()-]{6,20}$/, { message: 'Téléphone invalide' })
  clientPhone!: string;

  @IsOptional() @IsString() @Length(0, 500)
  notes?: string;
}
```

- [ ] **Step 2: UpdateBookingDto**

```ts
// apps/backend/src/modules/bookings/dto/update-booking.dto.ts
import { IsEnum, IsInt, IsISO8601, IsOptional, IsString, Length, Min, Max } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingDto {
  @IsOptional() @IsInt() @Min(1) @Max(50)
  partySize?: number;

  @IsOptional() @IsISO8601()
  date?: string;

  @IsOptional() @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional() @IsString() @Length(0, 500)
  notes?: string;
}
```

- [ ] **Step 3: GetBookingsQueryDto**

```ts
// apps/backend/src/modules/bookings/dto/get-bookings-query.dto.ts
import { Transform } from 'class-transformer';
import { IsEnum, IsISO8601, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class GetBookingsQueryDto {
  @IsOptional() @IsISO8601() from?: string;
  @IsOptional() @IsISO8601() to?: string;
  @IsOptional() @IsEnum(BookingStatus) status?: BookingStatus;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Transform(({ value }) => parseInt(value, 10)) @IsInt() @Min(1) page?: number;
  @IsOptional() @Transform(({ value }) => parseInt(value, 10)) @IsInt() @Min(1) pageSize?: number;
}
```

### Task M2.2: BookingsService.generateSlots — TDD première moitié

**Files:**
- Create: `apps/backend/src/modules/bookings/bookings.service.ts`
- Create: `apps/backend/src/modules/bookings/bookings.service.spec.ts`

- [ ] **Step 1: Test "renvoie [] si la date est en dehors du lookahead"**

```ts
// apps/backend/src/modules/bookings/bookings.service.spec.ts
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { ServiceWindowsService } from '../service-windows/service-windows.service';
import { ScheduleExceptionsService } from '../schedule-exceptions/schedule-exceptions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingsService } from './bookings.service';

describe('BookingsService.generateSlots', () => {
  let service: BookingsService;
  let prisma: any;
  let settings: any;
  let windows: any;
  let exceptions: any;

  beforeEach(async () => {
    prisma = { booking: { findMany: jest.fn().mockResolvedValue([]) } };
    settings = {
      getCapacityMax: jest.fn().mockResolvedValue(30),
      getDefaultMealDurationMin: jest.fn().mockResolvedValue(90),
      getAutoConfirmThreshold: jest.fn().mockResolvedValue(6),
      getLookaheadDays: jest.fn().mockResolvedValue(90),
      getCutoffHours: jest.fn().mockResolvedValue(2),
      getSlotIntervalMin: jest.fn().mockResolvedValue(15),
    };
    windows = { findActiveForDay: jest.fn().mockResolvedValue([]) };
    exceptions = { isDateBlocked: jest.fn().mockResolvedValue(false) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: SettingsService, useValue: settings },
        { provide: ServiceWindowsService, useValue: windows },
        { provide: ScheduleExceptionsService, useValue: exceptions },
        { provide: NotificationsService, useValue: { onBookingCreated: jest.fn(), onBookingCancelled: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(BookingsService);
  });

  it('renvoie [] si la date est au-delà du lookahead', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 200);
    const slots = await service.generateSlots(future.toISOString().slice(0, 10), 2);
    expect(slots).toEqual([]);
  });

  it('renvoie [] si exception bloque la date', async () => {
    exceptions.isDateBlocked.mockResolvedValue(true);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const slots = await service.generateSlots(tomorrow.toISOString().slice(0, 10), 2);
    expect(slots).toEqual([]);
  });

  it('renvoie [] si aucune ServiceWindow active ce jour', async () => {
    windows.findActiveForDay.mockResolvedValue([]);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const slots = await service.generateSlots(tomorrow.toISOString().slice(0, 10), 2);
    expect(slots).toEqual([]);
  });
});
```

- [ ] **Step 2: Vérifier que les tests fail**

```bash
pnpm --filter backend test -- bookings.service.spec.ts
```
Expected: FAIL "Cannot find module"

- [ ] **Step 3: Squelette `BookingsService` minimal qui fait passer les 3 premiers tests**

```ts
// apps/backend/src/modules/bookings/bookings.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { ServiceWindowsService } from '../service-windows/service-windows.service';
import { ScheduleExceptionsService } from '../schedule-exceptions/schedule-exceptions.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface AvailableSlot {
  time: string;                // "HH:mm"
  serviceWindowId: string;
  serviceWindowLabel: string;
  date: string;                // ISO date YYYY-MM-DD
}

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
    private windows: ServiceWindowsService,
    private exceptions: ScheduleExceptionsService,
    private notifications: NotificationsService,
  ) {}

  async generateSlots(dateISO: string, partySize: number): Promise<AvailableSlot[]> {
    // 1. Lookahead check
    const lookaheadDays = await this.settings.getLookaheadDays();
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const target = new Date(dateISO); target.setUTCHours(0, 0, 0, 0);
    const diffDays = Math.floor((target.getTime() - today.getTime()) / 86400000);
    if (diffDays < 0 || diffDays > lookaheadDays) return [];

    // 2. Exception check
    if (await this.exceptions.isDateBlocked(target)) return [];

    // 3. ServiceWindows
    const dayOfWeek = isoDayOfWeek(target);                  // 1..7
    const activeWindows = await this.windows.findActiveForDay(dayOfWeek);
    if (activeWindows.length === 0) return [];

    // À implémenter dans M2.3 : générer slots, vérifier capacité, drop cutoff
    return [];
  }
}

function isoDayOfWeek(d: Date): number {
  // JS: 0=dim..6=sam ; ISO: 1=lun..7=dim
  const js = d.getUTCDay();
  return js === 0 ? 7 : js;
}
```

- [ ] **Step 4: Vérifier que les 3 tests passent**

```bash
pnpm --filter backend test -- bookings.service.spec.ts
```
Expected: PASS x3

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/bookings/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(bookings): generateSlots squelette + tests early-return"
```

### Task M2.3: BookingsService.generateSlots — génération + capacité

**Files:**
- Modify: `apps/backend/src/modules/bookings/bookings.service.ts`
- Modify: `apps/backend/src/modules/bookings/bookings.service.spec.ts`

- [ ] **Step 1: Ajouter les tests "génération + capacité + cutoff"**

Ajouter ces `it()` dans la suite existante :

```ts
  it('génère les slots aux intervalles entre startTime et endTime inclus', async () => {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    windows.findActiveForDay.mockResolvedValue([
      { id: 'w1', label: 'Midi', startTime: '12:00', endTime: '13:00', daysOfWeek: [1,2,3,4,5,6,7] },
    ]);
    const slots = await service.generateSlots(tomorrow.toISOString().slice(0, 10), 2);
    const times = slots.map(s => s.time);
    expect(times).toEqual(['12:00', '12:15', '12:30', '12:45', '13:00']);
    expect(slots.every(s => s.serviceWindowId === 'w1')).toBe(true);
  });

  it('exclut les slots où la capacité serait dépassée', async () => {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    windows.findActiveForDay.mockResolvedValue([
      { id: 'w1', label: 'Midi', startTime: '12:00', endTime: '12:30', daysOfWeek: [1,2,3,4,5,6,7] },
    ]);
    settings.getCapacityMax.mockResolvedValue(10);
    // Booking existant : 8 couverts à 12:00 (occupe 12:00-13:30 avec duration 90min)
    const bookingDate = new Date(tomorrow); bookingDate.setUTCHours(12, 0, 0, 0);
    prisma.booking.findMany.mockResolvedValue([
      { date: bookingDate, partySize: 8 },
    ]);
    // Demande 4 couverts : 8 + 4 = 12 > 10 → tous les slots qui chevauchent sont exclus
    const slots = await service.generateSlots(tomorrow.toISOString().slice(0, 10), 4);
    expect(slots).toEqual([]);
  });

  it('drop slots avant now+cutoff si date = aujourd\'hui', async () => {
    const today = new Date();
    const todayISO = today.toISOString().slice(0, 10);
    windows.findActiveForDay.mockResolvedValue([
      { id: 'w1', label: 'Soir', startTime: '00:00', endTime: '23:45', daysOfWeek: [1,2,3,4,5,6,7] },
    ]);
    settings.getCutoffHours.mockResolvedValue(2);
    const slots = await service.generateSlots(todayISO, 2);
    // Aucun slot ne doit être dans le passé ou dans les 2h
    const cutoffMs = Date.now() + 2 * 3600 * 1000;
    for (const s of slots) {
      const [h, m] = s.time.split(':').map(Number);
      const slotMs = new Date(today.toISOString().slice(0,10) + 'T' + s.time + ':00.000Z').getTime();
      expect(slotMs).toBeGreaterThanOrEqual(cutoffMs);
    }
  });
```

- [ ] **Step 2: Vérifier qu'ils fail**

```bash
pnpm --filter backend test -- bookings.service.spec.ts
```
Expected: 3 nouveaux fails

- [ ] **Step 3: Compléter `generateSlots`**

Remplacer le corps de `generateSlots` par :

```ts
  async generateSlots(dateISO: string, partySize: number): Promise<AvailableSlot[]> {
    const lookaheadDays = await this.settings.getLookaheadDays();
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const target = new Date(dateISO); target.setUTCHours(0, 0, 0, 0);
    const diffDays = Math.floor((target.getTime() - today.getTime()) / 86400000);
    if (diffDays < 0 || diffDays > lookaheadDays) return [];

    if (await this.exceptions.isDateBlocked(target)) return [];

    const dayOfWeek = isoDayOfWeek(target);
    const activeWindows = await this.windows.findActiveForDay(dayOfWeek);
    if (activeWindows.length === 0) return [];

    const intervalMin = await this.settings.getSlotIntervalMin();
    const durationMin = await this.settings.getDefaultMealDurationMin();
    const capacityMax = await this.settings.getCapacityMax();
    const cutoffMs = Date.now() + (await this.settings.getCutoffHours()) * 3600 * 1000;
    const isToday = diffDays === 0;

    // Bookings du jour, status non annulé
    const dayStart = new Date(target);
    const dayEnd = new Date(target); dayEnd.setUTCHours(23, 59, 59, 999);
    const bookings = await this.prisma.booking.findMany({
      where: { date: { gte: dayStart, lte: dayEnd }, status: { in: ['PENDING', 'CONFIRMED'] } },
    });

    const slots: AvailableSlot[] = [];
    for (const w of activeWindows) {
      const [sh, sm] = w.startTime.split(':').map(Number);
      const [eh, em] = w.endTime.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      for (let m = startMin; m <= endMin; m += intervalMin) {
        const hh = Math.floor(m / 60).toString().padStart(2, '0');
        const mm = (m % 60).toString().padStart(2, '0');
        const slotISO = `${dateISO}T${hh}:${mm}:00.000Z`;
        const slotStart = new Date(slotISO).getTime();
        const slotEnd = slotStart + durationMin * 60000;

        if (isToday && slotStart < cutoffMs) continue;

        // Capacité : somme partySize qui chevauchent ce slot
        let occupied = 0;
        for (const b of bookings) {
          const bStart = new Date(b.date).getTime();
          const bEnd = bStart + durationMin * 60000;
          if (bStart < slotEnd && bEnd > slotStart) occupied += b.partySize;
        }
        if (occupied + partySize > capacityMax) continue;

        slots.push({ time: `${hh}:${mm}`, serviceWindowId: w.id, serviceWindowLabel: w.label, date: dateISO });
      }
    }
    return slots;
  }
```

- [ ] **Step 4: Vérifier que tous les tests passent**

```bash
pnpm --filter backend test -- bookings.service.spec.ts
```
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/bookings/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(bookings): generateSlots avec capacité + cutoff + intervalle"
```

### Task M2.4: BookingsService.create avec auto-confirm + double-check

**Files:**
- Modify: `apps/backend/src/modules/bookings/bookings.service.ts`
- Modify: `apps/backend/src/modules/bookings/bookings.service.spec.ts`

- [ ] **Step 1: Tests pour `create()`**

```ts
  describe('create', () => {
    it('crée en CONFIRMED si partySize <= threshold', async () => {
      settings.getAutoConfirmThreshold.mockResolvedValue(6);
      windows.findActiveForDay.mockResolvedValue([
        { id: 'w1', label: 'Midi', startTime: '12:00', endTime: '14:00', daysOfWeek: [1,2,3,4,5,6,7] },
      ]);
      prisma.booking = { ...prisma.booking, create: jest.fn().mockResolvedValue({ id: 'b1', status: 'CONFIRMED' }) };
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setUTCHours(12, 30, 0, 0);
      const result = await service.create({
        partySize: 4, date: tomorrow.toISOString(),
        clientName: 'Alice', clientEmail: 'a@b.fr', clientPhone: '0600000000',
      } as any);
      expect(result.status).toBe('CONFIRMED');
      expect(prisma.booking.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'CONFIRMED', partySize: 4 }),
      }));
    });

    it('crée en PENDING si partySize > threshold', async () => {
      settings.getAutoConfirmThreshold.mockResolvedValue(6);
      windows.findActiveForDay.mockResolvedValue([
        { id: 'w1', label: 'Midi', startTime: '12:00', endTime: '14:00', daysOfWeek: [1,2,3,4,5,6,7] },
      ]);
      prisma.booking = { ...prisma.booking, create: jest.fn().mockResolvedValue({ id: 'b1', status: 'PENDING' }) };
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setUTCHours(12, 30, 0, 0);
      const result = await service.create({
        partySize: 10, date: tomorrow.toISOString(),
        clientName: 'Bob', clientEmail: 'b@c.fr', clientPhone: '0600000000',
      } as any);
      expect(result.status).toBe('PENDING');
    });

    it('rejette si capacité dépassée (race condition guard)', async () => {
      settings.getCapacityMax.mockResolvedValue(10);
      windows.findActiveForDay.mockResolvedValue([
        { id: 'w1', label: 'Midi', startTime: '12:00', endTime: '14:00', daysOfWeek: [1,2,3,4,5,6,7] },
      ]);
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setUTCHours(12, 30, 0, 0);
      prisma.booking.findMany.mockResolvedValue([
        { date: tomorrow, partySize: 8 },
      ]);
      await expect(service.create({
        partySize: 4, date: tomorrow.toISOString(),
        clientName: 'X', clientEmail: 'x@x.fr', clientPhone: '0600000000',
      } as any)).rejects.toThrow(/plus disponible|capacité/i);
    });
  });
```

- [ ] **Step 2: Implémenter `create`**

Ajouter à `BookingsService` :

```ts
  async create(dto: { partySize: number; date: string; clientName: string; clientEmail: string; clientPhone: string; notes?: string }) {
    const dateISO = dto.date.slice(0, 10);
    // Re-vérifier la dispo (race condition guard) — réutilise generateSlots
    const slots = await this.generateSlots(dateISO, dto.partySize);
    const requestedTime = dto.date.slice(11, 16); // "HH:mm"
    const slot = slots.find(s => s.time === requestedTime);
    if (!slot) {
      throw new (await import('@nestjs/common')).BadRequestException('Ce créneau n\'est plus disponible.');
    }

    const threshold = await this.settings.getAutoConfirmThreshold();
    const status = dto.partySize <= threshold ? 'CONFIRMED' : 'PENDING';

    const booking = await this.prisma.booking.create({
      data: {
        partySize: dto.partySize,
        date: new Date(dto.date),
        serviceWindowId: slot.serviceWindowId,
        clientName: dto.clientName,
        clientEmail: dto.clientEmail,
        clientPhone: dto.clientPhone,
        notes: dto.notes ?? null,
        status,
        confirmedAt: status === 'CONFIRMED' ? new Date() : null,
      },
    });

    await this.notifications.onBookingCreated(booking);
    return booking;
  }
```

- [ ] **Step 3: Tests passent**

```bash
pnpm --filter backend test -- bookings.service.spec.ts
```
Expected: PASS (9 tests)

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/modules/bookings/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(bookings): create avec auto-confirm + race-check"
```

### Task M2.5: BookingsService.cancelByToken + confirmByToken

**Files:**
- Modify: `apps/backend/src/modules/bookings/bookings.service.ts`
- Modify: `apps/backend/src/modules/bookings/bookings.service.spec.ts`

- [ ] **Step 1: Tests**

```ts
  describe('cancelByToken', () => {
    it('annule un booking via cancelToken', async () => {
      prisma.booking.findUnique = jest.fn().mockResolvedValue({ id: 'b1', status: 'CONFIRMED', cancelToken: 'tok' });
      prisma.booking.update = jest.fn().mockResolvedValue({ id: 'b1', status: 'CANCELLED' });
      const r = await service.cancelByToken('tok');
      expect(r.status).toBe('CANCELLED');
      expect(prisma.booking.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'CANCELLED' }),
      }));
    });
    it('throw 404 si token inconnu', async () => {
      prisma.booking.findUnique = jest.fn().mockResolvedValue(null);
      await expect(service.cancelByToken('bad')).rejects.toThrow(/non trouvé|not found/i);
    });
    it('throw si déjà annulé', async () => {
      prisma.booking.findUnique = jest.fn().mockResolvedValue({ id: 'b1', status: 'CANCELLED', cancelToken: 'tok' });
      await expect(service.cancelByToken('tok')).rejects.toThrow(/déjà annulé/i);
    });
  });
```

- [ ] **Step 2: Implémenter**

```ts
  async cancelByToken(cancelToken: string) {
    const { NotFoundException, BadRequestException } = await import('@nestjs/common');
    const b = await this.prisma.booking.findUnique({ where: { cancelToken } });
    if (!b) throw new NotFoundException('Réservation non trouvée');
    if (b.status === 'CANCELLED') throw new BadRequestException('Réservation déjà annulée');
    const updated = await this.prisma.booking.update({
      where: { id: b.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
    await this.notifications.onBookingCancelled(updated, 'client');
    return updated;
  }

  async confirmByToken(confirmToken: string) {
    const { NotFoundException } = await import('@nestjs/common');
    const b = await this.prisma.booking.findUnique({ where: { confirmToken } });
    if (!b) throw new NotFoundException('Réservation non trouvée');
    if (b.status === 'CONFIRMED') return b;
    return this.prisma.booking.update({
      where: { id: b.id },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    });
  }
```

- [ ] **Step 3: Tests passent**

```bash
pnpm --filter backend test -- bookings.service.spec.ts
```
Expected: PASS (12 tests)

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/modules/bookings/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(bookings): cancel/confirm by token"
```

### Task M2.6: BookingsService — admin operations (list, get, patch, delete, agenda)

**Files:**
- Modify: `apps/backend/src/modules/bookings/bookings.service.ts`

- [ ] **Step 1: Ajouter les méthodes admin (sans tests TDD pour les CRUDs simples — couverts par e2e plus tard)**

```ts
  async findAll(query: { from?: string; to?: string; status?: string; search?: string; page?: number; pageSize?: number }) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const where: any = {};
    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = new Date(query.from);
      if (query.to)   where.date.lte = new Date(query.to);
    }
    if (query.status) where.status = query.status;
    if (query.search) where.OR = [
      { clientName:  { contains: query.search, mode: 'insensitive' } },
      { clientEmail: { contains: query.search, mode: 'insensitive' } },
      { clientPhone: { contains: query.search } },
    ];
    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where, include: { serviceWindow: true },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize, take: pageSize,
      }),
      this.prisma.booking.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const { NotFoundException } = await import('@nestjs/common');
    const b = await this.prisma.booking.findUnique({ where: { id }, include: { serviceWindow: true } });
    if (!b) throw new NotFoundException();
    return b;
  }

  async update(id: string, dto: { partySize?: number; date?: string; status?: string; notes?: string }) {
    const data: any = {};
    if (dto.partySize !== undefined) data.partySize = dto.partySize;
    if (dto.date !== undefined)      data.date = new Date(dto.date);
    if (dto.notes !== undefined)     data.notes = dto.notes;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === 'CONFIRMED') data.confirmedAt = new Date();
      if (dto.status === 'CANCELLED') data.cancelledAt = new Date();
    }
    const updated = await this.prisma.booking.update({ where: { id }, data });
    if (dto.status === 'CONFIRMED') await this.notifications.onBookingConfirmedByAdmin(updated);
    if (dto.status === 'CANCELLED') await this.notifications.onBookingCancelled(updated, 'admin');
    return updated;
  }

  async remove(id: string) {
    return this.prisma.booking.delete({ where: { id } });
  }

  async agenda(from: string, to: string) {
    const items = await this.prisma.booking.findMany({
      where: {
        date: { gte: new Date(from), lte: new Date(to) },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: { serviceWindow: true },
      orderBy: { date: 'asc' },
    });
    // Group par jour (YYYY-MM-DD)
    const byDay: Record<string, typeof items> = {};
    for (const i of items) {
      const day = i.date.toISOString().slice(0, 10);
      (byDay[day] ??= []).push(i);
    }
    return byDay;
  }
```

- [ ] **Step 2: Vérifier compile**

```bash
pnpm --filter backend build
```
Expected: build OK

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/modules/bookings/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(bookings): admin CRUD + agenda"
```

### Task M2.7: BookingsController public + admin

**Files:**
- Create: `apps/backend/src/modules/bookings/bookings.controller.ts`
- Create: `apps/backend/src/modules/bookings/bookings.module.ts`

- [ ] **Step 1: Controller**

```ts
// apps/backend/src/modules/bookings/bookings.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { GetBookingsQueryDto } from './dto/get-bookings-query.dto';

@ApiTags('bookings')
@Controller()
export class BookingsController {
  constructor(private bookings: BookingsService) {}

  // ─── Public ───────────────────────────────────────────────
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('bookings')
  create(@Body() dto: CreateBookingDto) {
    return this.bookings.create(dto);
  }

  @Public()
  @Get('bookings/:cancelToken/cancel')
  cancel(@Param('cancelToken') token: string) {
    return this.bookings.cancelByToken(token);
  }

  @Public()
  @Get('bookings/:confirmToken/confirm')
  confirm(@Param('confirmToken') token: string) {
    return this.bookings.confirmByToken(token);
  }

  // ─── Admin ────────────────────────────────────────────────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/bookings')
  findAll(@Query() q: GetBookingsQueryDto) {
    return this.bookings.findAll(q);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/bookings/agenda')
  agenda(@Query('from') from: string, @Query('to') to: string) {
    return this.bookings.agenda(from, to);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/bookings/:id')
  findOne(@Param('id') id: string) {
    return this.bookings.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('admin/bookings/:id')
  update(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.bookings.update(id, dto as any);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('admin/bookings/:id')
  remove(@Param('id') id: string) {
    return this.bookings.remove(id);
  }
}
```

- [ ] **Step 2: Module**

```ts
// apps/backend/src/modules/bookings/bookings.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { ServiceWindowsModule } from '../service-windows/service-windows.module';
import { ScheduleExceptionsModule } from '../schedule-exceptions/schedule-exceptions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [PrismaModule, SettingsModule, ServiceWindowsModule, ScheduleExceptionsModule, NotificationsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
```

- [ ] **Step 3: Wire dans `app.module.ts`** (le module sera importé après création de ServiceWindows/ScheduleExceptions/Notifications en M3/M4)

Pour l'instant, **commenter** l'import de `BookingsModule` dans `app.module.ts` jusqu'à ce que ses dépendances existent. Sera décommenté à la fin de M4.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/modules/bookings/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(bookings): controller public + admin + module (deps en M3/M4)"
```

---

## Milestone 3 — Schedule modules backend (5 tâches)

**Output testable :** ServiceWindows et ScheduleExceptions ont leur CRUD complet, validations DTO actives, helpers `findActiveForDay` et `isDateBlocked` testés, `pnpm test` passe.

### Task M3.1: ServiceWindows — DTOs + service + tests

**Files:**
- Create: `apps/backend/src/modules/service-windows/dto/create-service-window.dto.ts`
- Create: `apps/backend/src/modules/service-windows/dto/update-service-window.dto.ts`
- Create: `apps/backend/src/modules/service-windows/dto/reorder.dto.ts`
- Create: `apps/backend/src/modules/service-windows/service-windows.service.ts`
- Create: `apps/backend/src/modules/service-windows/service-windows.service.spec.ts`

- [ ] **Step 1: DTOs**

```ts
// dto/create-service-window.dto.ts
import { ArrayMinSize, ArrayUnique, IsArray, IsBoolean, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateServiceWindowDto {
  @IsString() @Length(1, 50)
  label!: string;

  @IsArray() @ArrayMinSize(1) @ArrayUnique()
  @IsInt({ each: true }) @Min(1, { each: true }) @Max(7, { each: true })
  daysOfWeek!: number[];

  @IsString() @Matches(HHMM, { message: 'startTime doit être HH:mm' })
  startTime!: string;

  @IsString() @Matches(HHMM, { message: 'endTime doit être HH:mm' })
  endTime!: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
```

```ts
// dto/update-service-window.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateServiceWindowDto } from './create-service-window.dto';
export class UpdateServiceWindowDto extends PartialType(CreateServiceWindowDto) {}
```

```ts
// dto/reorder.dto.ts
import { IsArray, IsString } from 'class-validator';
export class ReorderDto {
  @IsArray() @IsString({ each: true })
  ids!: string[];
}
```

- [ ] **Step 2: Tests service**

```ts
// service-windows.service.spec.ts
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceWindowsService } from './service-windows.service';

describe('ServiceWindowsService', () => {
  let service: ServiceWindowsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = { serviceWindow: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() } };
    const moduleRef = await Test.createTestingModule({
      providers: [ServiceWindowsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(ServiceWindowsService);
  });

  describe('create', () => {
    it('throw si endTime <= startTime', async () => {
      await expect(service.create({ label: 'X', daysOfWeek: [1], startTime: '14:00', endTime: '12:00' } as any))
        .rejects.toThrow(/endTime/i);
    });
    it('crée si valide', async () => {
      prisma.serviceWindow.create.mockResolvedValue({ id: 'w1' });
      const r = await service.create({ label: 'Midi', daysOfWeek: [2,3,4], startTime: '12:00', endTime: '14:00' } as any);
      expect(r.id).toBe('w1');
    });
  });

  describe('findActiveForDay', () => {
    it('renvoie windows actives contenant le jour ISO demandé', async () => {
      prisma.serviceWindow.findMany.mockResolvedValue([
        { id: 'w1', daysOfWeek: [1,2,3], isActive: true },
        { id: 'w2', daysOfWeek: [5,6,7], isActive: true },
      ]);
      const r = await service.findActiveForDay(2);
      // Le test pgArrayContains : on attend que prisma soit appelé avec where: { isActive: true, daysOfWeek: { has: 2 } }
      expect(prisma.serviceWindow.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { isActive: true, daysOfWeek: { has: 2 } },
      }));
    });
  });
});
```

- [ ] **Step 3: Service**

```ts
// service-windows.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ServiceWindowsService {
  constructor(private prisma: PrismaService) {}

  private validateTimes(startTime: string, endTime: string) {
    if (startTime >= endTime) throw new BadRequestException('endTime doit être strictement supérieur à startTime');
  }

  findAll() {
    return this.prisma.serviceWindow.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  }

  findActiveForDay(dayOfWeek: number) {
    return this.prisma.serviceWindow.findMany({
      where: { isActive: true, daysOfWeek: { has: dayOfWeek } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(dto: { label: string; daysOfWeek: number[]; startTime: string; endTime: string; isActive?: boolean }) {
    this.validateTimes(dto.startTime, dto.endTime);
    return this.prisma.serviceWindow.create({ data: { ...dto, isActive: dto.isActive ?? true } });
  }

  async update(id: string, dto: Partial<{ label: string; daysOfWeek: number[]; startTime: string; endTime: string; isActive: boolean }>) {
    if (dto.startTime && dto.endTime) this.validateTimes(dto.startTime, dto.endTime);
    try {
      return await this.prisma.serviceWindow.update({ where: { id }, data: dto });
    } catch {
      throw new NotFoundException();
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.serviceWindow.delete({ where: { id } });
    } catch {
      throw new NotFoundException();
    }
  }

  async reorder(ids: string[]) {
    await Promise.all(ids.map((id, idx) =>
      this.prisma.serviceWindow.update({ where: { id }, data: { sortOrder: idx } }),
    ));
    return this.findAll();
  }
}
```

- [ ] **Step 4: Tests passent**

```bash
pnpm --filter backend test -- service-windows.service.spec.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/service-windows/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(service-windows): service + DTOs + tests"
```

### Task M3.2: ServiceWindows — controller + module + wire

**Files:**
- Create: `apps/backend/src/modules/service-windows/service-windows.controller.ts`
- Create: `apps/backend/src/modules/service-windows/service-windows.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 1: Controller**

```ts
// service-windows.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ServiceWindowsService } from './service-windows.service';
import { CreateServiceWindowDto } from './dto/create-service-window.dto';
import { UpdateServiceWindowDto } from './dto/update-service-window.dto';
import { ReorderDto } from './dto/reorder.dto';

@ApiTags('service-windows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('service-windows')
export class ServiceWindowsController {
  constructor(private svc: ServiceWindowsService) {}
  @Get()                         findAll()                                              { return this.svc.findAll(); }
  @Post()                        create(@Body() dto: CreateServiceWindowDto)            { return this.svc.create(dto); }
  @Patch('reorder')              reorder(@Body() dto: ReorderDto)                       { return this.svc.reorder(dto.ids); }
  @Patch(':id')                  update(@Param('id') id: string, @Body() dto: UpdateServiceWindowDto) { return this.svc.update(id, dto); }
  @Delete(':id')                 remove(@Param('id') id: string)                        { return this.svc.remove(id); }
}
```

- [ ] **Step 2: Module**

```ts
// service-windows.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ServiceWindowsController } from './service-windows.controller';
import { ServiceWindowsService } from './service-windows.service';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceWindowsController],
  providers: [ServiceWindowsService],
  exports: [ServiceWindowsService],
})
export class ServiceWindowsModule {}
```

- [ ] **Step 3: Wire dans `app.module.ts`** : ajouter `ServiceWindowsModule` aux imports.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/modules/service-windows/ apps/backend/src/app.module.ts
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(service-windows): controller + module wired"
```

### Task M3.3: ScheduleExceptions — service + DTO + tests

**Files:**
- Create: `apps/backend/src/modules/schedule-exceptions/dto/create-exception.dto.ts`
- Create: `apps/backend/src/modules/schedule-exceptions/schedule-exceptions.service.ts`
- Create: `apps/backend/src/modules/schedule-exceptions/schedule-exceptions.service.spec.ts`

- [ ] **Step 1: DTO**

```ts
// dto/create-exception.dto.ts
import { IsISO8601, IsOptional, IsString, Length } from 'class-validator';

export class CreateExceptionDto {
  @IsISO8601() startDate!: string;
  @IsISO8601() endDate!: string;
  @IsOptional() @IsString() @Length(0, 200) reason?: string;
}
```

- [ ] **Step 2: Tests**

```ts
// schedule-exceptions.service.spec.ts
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ScheduleExceptionsService } from './schedule-exceptions.service';

describe('ScheduleExceptionsService', () => {
  let service: ScheduleExceptionsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = { scheduleException: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), delete: jest.fn() } };
    const moduleRef = await Test.createTestingModule({
      providers: [ScheduleExceptionsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(ScheduleExceptionsService);
  });

  it('throw si endDate < startDate', async () => {
    await expect(service.create({ startDate: '2026-05-10', endDate: '2026-05-01' } as any))
      .rejects.toThrow(/endDate/i);
  });

  it('isDateBlocked retourne true si une exception couvre la date', async () => {
    prisma.scheduleException.findFirst.mockResolvedValue({ id: 'x' });
    expect(await service.isDateBlocked(new Date('2026-05-05'))).toBe(true);
  });

  it('isDateBlocked retourne false sinon', async () => {
    prisma.scheduleException.findFirst.mockResolvedValue(null);
    expect(await service.isDateBlocked(new Date('2026-05-05'))).toBe(false);
  });
});
```

- [ ] **Step 3: Service**

```ts
// schedule-exceptions.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ScheduleExceptionsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.scheduleException.findMany({ orderBy: { startDate: 'asc' } });
  }

  async create(dto: { startDate: string; endDate: string; reason?: string }) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start) throw new BadRequestException('endDate doit être >= startDate');
    return this.prisma.scheduleException.create({
      data: { startDate: start, endDate: end, reason: dto.reason ?? null },
    });
  }

  async remove(id: string) {
    try { return await this.prisma.scheduleException.delete({ where: { id } }); }
    catch { throw new NotFoundException(); }
  }

  async isDateBlocked(date: Date): Promise<boolean> {
    const d = new Date(date); d.setUTCHours(0, 0, 0, 0);
    const found = await this.prisma.scheduleException.findFirst({
      where: { startDate: { lte: d }, endDate: { gte: d } },
    });
    return !!found;
  }
}
```

- [ ] **Step 4: Tests passent**

```bash
pnpm --filter backend test -- schedule-exceptions.service.spec.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/schedule-exceptions/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(schedule-exceptions): service + DTO + tests"
```

### Task M3.4: ScheduleExceptions — controller + module + wire

**Files:**
- Create: `apps/backend/src/modules/schedule-exceptions/schedule-exceptions.controller.ts`
- Create: `apps/backend/src/modules/schedule-exceptions/schedule-exceptions.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 1: Controller**

```ts
// schedule-exceptions.controller.ts
import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ScheduleExceptionsService } from './schedule-exceptions.service';
import { CreateExceptionDto } from './dto/create-exception.dto';

@ApiTags('schedule-exceptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schedule-exceptions')
export class ScheduleExceptionsController {
  constructor(private svc: ScheduleExceptionsService) {}
  @Get()        findAll()                            { return this.svc.findAll(); }
  @Post()       create(@Body() dto: CreateExceptionDto) { return this.svc.create(dto); }
  @Delete(':id') remove(@Param('id') id: string)      { return this.svc.remove(id); }
}
```

- [ ] **Step 2: Module**

```ts
// schedule-exceptions.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ScheduleExceptionsController } from './schedule-exceptions.controller';
import { ScheduleExceptionsService } from './schedule-exceptions.service';

@Module({
  imports: [PrismaModule],
  controllers: [ScheduleExceptionsController],
  providers: [ScheduleExceptionsService],
  exports: [ScheduleExceptionsService],
})
export class ScheduleExceptionsModule {}
```

- [ ] **Step 3: Wire dans `app.module.ts`** + commit

```bash
git add apps/backend/src/modules/schedule-exceptions/ apps/backend/src/app.module.ts
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(schedule-exceptions): controller + module wired"
```

### Task M3.5: Smoke test M3 + milestone tag

- [ ] **Step 1: Lancer les tests backend complets**

```bash
pnpm --filter backend test
```
Expected: tous les tests passent (settings + bookings + service-windows + schedule-exceptions + auth héritage)

- [ ] **Step 2: Smoke API avec curl**

```bash
pnpm --filter backend dev &
sleep 10
TOKEN=$(curl -s -X POST http://localhost:3101/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@example.fr","password":"Admin1234!"}' | jq -r '.data.accessToken')
curl -s http://localhost:3101/service-windows -H "Authorization: Bearer $TOKEN" | jq '.data | length'
kill %1
```
Expected: `2` (les 2 windows seedées en M1.3)

- [ ] **Step 3: Milestone tag commit**

```bash
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit --allow-empty -m "milestone(M3): schedule modules done"
```

---

## Milestone 4 — Images PDF + Notifications + Cron J-1 (12 tâches)

**Output testable :** Upload d'image OU PDF jusqu'à 5 Mo passe, mailer envoie en MailHog (dev) et Resend (prod) selon `NODE_ENV`, les 9 templates email sont rendus, le cron J-1 sélectionne les bonnes résa et set `reminderSentAt`. Tests Jest couvrent magic-bytes + mailer + cron.

### Task M4.1: Étendre ImagesService pour accepter PDF

**Files:**
- Modify: `apps/backend/src/modules/images/images.service.ts`
- Modify: `apps/backend/src/modules/images/images.service.spec.ts`

- [ ] **Step 1: Installer `file-type`**

```bash
pnpm --filter backend add file-type
```

- [ ] **Step 2: Tests étendus**

Ajouter à `images.service.spec.ts` (ou écraser le fichier hérité avec ces nouveaux tests si schema différent) :

```ts
  describe('upload PDF', () => {
    it('accepte un application/pdf jusqu\'à 5 Mo', async () => {
      const buffer = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(100)]);
      prisma.image = { ...prisma.image, create: jest.fn().mockResolvedValue({ id: 'img-pdf' }) };
      const r = await service.upload({
        section: 'MENU',
        mimeType: 'application/pdf',
        size: buffer.length,
        buffer,
      } as any);
      expect(r.id).toBe('img-pdf');
      expect(prisma.image.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ mimeType: 'application/pdf', width: null, height: null }),
      }));
    });

    it('refuse > 5 Mo', async () => {
      const buffer = Buffer.alloc(6 * 1024 * 1024);
      await expect(service.upload({
        section: 'MENU', mimeType: 'application/pdf', size: buffer.length, buffer,
      } as any)).rejects.toThrow(/5\s?Mo|trop volumineux/i);
    });

    it('refuse mimeType non whitelisté', async () => {
      const buffer = Buffer.from('hello');
      await expect(service.upload({
        section: 'MENU', mimeType: 'application/octet-stream', size: 5, buffer,
      } as any)).rejects.toThrow(/non autorisé|mimeType/i);
    });

    it('refuse spoofing extension : magic-bytes ne matchent pas le mimeType déclaré', async () => {
      const buffer = Buffer.from('PK\x03\x04 ZIP file pretending to be JPEG');
      await expect(service.upload({
        section: 'MENU', mimeType: 'image/jpeg', size: buffer.length, buffer,
      } as any)).rejects.toThrow(/contenu/i);
    });
  });
```

- [ ] **Step 3: Implémenter le nouveau `upload`**

Réécrire `ImagesService.upload` :

```ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import { PrismaService } from '../../prisma/prisma.service';

const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const ALLOWED_SECTIONS = new Set(['HERO', 'HOMESECTION', 'MENU', 'OTHER']);

@Injectable()
export class ImagesService {
  constructor(private prisma: PrismaService) {}

  async upload(input: { section: string; mimeType: string; size: number; buffer: Buffer; caption?: string; width?: number; height?: number }) {
    if (!ALLOWED_SECTIONS.has(input.section)) throw new BadRequestException('Section invalide');
    if (!ALLOWED_MIMES.has(input.mimeType))   throw new BadRequestException('mimeType non autorisé');
    if (input.size > MAX_SIZE)                throw new BadRequestException('Fichier trop volumineux (max 5 Mo)');

    // Magic-bytes check (défense anti-spoofing)
    const detected = await fileTypeFromBuffer(input.buffer);
    if (!detected || detected.mime !== input.mimeType) {
      throw new BadRequestException('Le contenu du fichier ne correspond pas au type déclaré');
    }

    const isPdf = input.mimeType === 'application/pdf';
    return this.prisma.image.create({
      data: {
        section: input.section as any,
        mimeType: input.mimeType,
        size: input.size,
        width:  isPdf ? null : (input.width ?? 0),
        height: isPdf ? null : (input.height ?? 0),
        data: input.buffer,
        caption: input.caption ?? null,
      },
    });
  }

  findBySection(section: string) {
    return this.prisma.image.findMany({
      where: { section: section as any },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: { id: true, section: true, mimeType: true, width: true, height: true, size: true, sortOrder: true, caption: true, createdAt: true },
    });
  }

  async getRaw(id: string) {
    const img = await this.prisma.image.findUnique({ where: { id } });
    if (!img) throw new NotFoundException();
    return img;
  }

  async update(id: string, dto: { caption?: string; sortOrder?: number; section?: string }) {
    try { return await this.prisma.image.update({ where: { id }, data: dto as any }); }
    catch { throw new NotFoundException(); }
  }

  async remove(id: string) {
    try { return await this.prisma.image.delete({ where: { id } }); }
    catch (e: any) {
      if (e.code === 'P2003') throw new BadRequestException('Image utilisée par un MenuDocument, désassocier d\'abord');
      throw new NotFoundException();
    }
  }

  async reorder(ids: string[]) {
    await Promise.all(ids.map((id, idx) =>
      this.prisma.image.update({ where: { id }, data: { sortOrder: idx } }),
    ));
    return { ok: true };
  }
}
```

- [ ] **Step 4: Tests passent**

```bash
pnpm --filter backend test -- images.service.spec.ts
```
Expected: PASS (incl. nouveaux tests PDF)

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/images/ apps/backend/package.json
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(images): accept PDF jusqu'à 5 Mo + magic-bytes check"
```

### Task M4.2: ImagesController — adaptation pour servir PDF inline

**Files:**
- Modify: `apps/backend/src/modules/images/images.controller.ts`

- [ ] **Step 1: Adapter `GET /images/:id` pour gérer le Content-Type selon mimeType**

```ts
// images.controller.ts (extrait pertinent — le reste du controller hérite avec adaptation)
import { Controller, Delete, Get, Header, Param, Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ImagesService } from './images.service';
import { UpdateImageDto } from './dto/update-image.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';

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
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('section') section: string,
    @Body('caption') caption?: string,
    @Body('width') width?: string,
    @Body('height') height?: string,
  ) {
    return this.images.upload({
      section,
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
    return this.images.findBySection(section);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch('admin/images/reorder')
  reorder(@Body() dto: ReorderImagesDto) { return this.images.reorder(dto.ids); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch('admin/images/:id')
  update(@Param('id') id: string, @Body() dto: UpdateImageDto) { return this.images.update(id, dto as any); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Delete('admin/images/:id')
  remove(@Param('id') id: string) { return this.images.remove(id); }
}
```

- [ ] **Step 2: Vérifier compile + commit**

```bash
pnpm --filter backend build
git add apps/backend/src/modules/images/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(images): controller serve PDF inline + section filter"
```

### Task M4.3: MailerService — abstraction + interface

**Files:**
- Create: `apps/backend/src/modules/notifications/mailer/mailer.service.ts`
- Create: `apps/backend/src/modules/notifications/mailer/types.ts`

- [ ] **Step 1: Types**

```ts
// notifications/mailer/types.ts
export type EmailTemplate =
  | 'booking-confirmed'
  | 'booking-pending'
  | 'booking-admin-alert'
  | 'booking-confirmed-after-pending'
  | 'booking-cancelled-by-admin'
  | 'booking-cancelled-by-client'
  | 'booking-cancelled-admin-notify'
  | 'booking-reminder'
  | 'contact-message-alert';

export interface MailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface IMailerProvider {
  send(payload: MailPayload): Promise<void>;
}
```

- [ ] **Step 2: MailerService**

```ts
// notifications/mailer/mailer.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { IMailerProvider, MailPayload } from './types';

export const MAILER_PROVIDER = 'MAILER_PROVIDER';

@Injectable()
export class MailerService {
  constructor(@Inject(MAILER_PROVIDER) private provider: IMailerProvider) {}

  send(payload: MailPayload) {
    return this.provider.send(payload);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/modules/notifications/mailer/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(notifications): MailerService abstraction"
```

### Task M4.4: NodemailerProvider (dev)

**Files:**
- Create: `apps/backend/src/modules/notifications/mailer/nodemailer.provider.ts`

- [ ] **Step 1: Installer si absent**

```bash
pnpm --filter backend add nodemailer
pnpm --filter backend add -D @types/nodemailer
```

- [ ] **Step 2: Provider**

```ts
// notifications/mailer/nodemailer.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IMailerProvider, MailPayload } from './types';

@Injectable()
export class NodemailerProvider implements IMailerProvider {
  private readonly logger = new Logger(NodemailerProvider.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST', 'localhost'),
      port: parseInt(config.get('SMTP_PORT', '1025'), 10),
      secure: false,
      auth: config.get('SMTP_USER') ? { user: config.get('SMTP_USER'), pass: config.get('SMTP_PASS') } : undefined,
    });
    this.from = config.get('MAIL_FROM', 'reservation@booking-resto.local');
  }

  async send(payload: MailPayload): Promise<void> {
    const info = await this.transporter.sendMail({
      from: this.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    this.logger.log(`Mail envoyé via Nodemailer (${info.messageId}) → ${payload.to}`);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/modules/notifications/mailer/ apps/backend/package.json
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(notifications): NodemailerProvider (dev / MailHog)"
```

### Task M4.5: ResendProvider (prod)

**Files:**
- Create: `apps/backend/src/modules/notifications/mailer/resend.provider.ts`
- Modify: `.env.example`

- [ ] **Step 1: Installer**

```bash
pnpm --filter backend add resend
```

- [ ] **Step 2: Provider**

```ts
// notifications/mailer/resend.provider.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { IMailerProvider, MailPayload } from './types';

@Injectable()
export class ResendProvider implements IMailerProvider {
  private readonly logger = new Logger(ResendProvider.name);
  private readonly client: Resend;
  private readonly from: string;

  constructor(private config: ConfigService) {
    const key = config.get<string>('RESEND_API_KEY');
    if (!key) throw new Error('RESEND_API_KEY manquant en production');
    this.client = new Resend(key);
    this.from = config.get('MAIL_FROM') ?? '';
    if (!this.from) throw new Error('MAIL_FROM manquant en production');
  }

  async send(payload: MailPayload): Promise<void> {
    const { error, data } = await this.client.emails.send({
      from: this.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    if (error) {
      this.logger.error(`Resend send failed: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Échec envoi email');
    }
    this.logger.log(`Mail envoyé via Resend (${data?.id}) → ${payload.to}`);
  }
}
```

- [ ] **Step 3: Ajouter au `.env.example`**

```
RESEND_API_KEY=
MAIL_FROM="Mon Restaurant <reservation@example.fr>"
ADMIN_EMAIL=admin@example.fr
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/modules/notifications/mailer/ apps/backend/package.json .env.example
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(notifications): ResendProvider (prod)"
```

### Task M4.6: Templates HTML (9 fichiers)

**Files:**
- Create: `apps/backend/src/modules/notifications/templates/booking-confirmed.html`
- Create: `apps/backend/src/modules/notifications/templates/booking-pending.html`
- Create: `apps/backend/src/modules/notifications/templates/booking-admin-alert.html`
- Create: `apps/backend/src/modules/notifications/templates/booking-confirmed-after-pending.html`
- Create: `apps/backend/src/modules/notifications/templates/booking-cancelled-by-admin.html`
- Create: `apps/backend/src/modules/notifications/templates/booking-cancelled-by-client.html`
- Create: `apps/backend/src/modules/notifications/templates/booking-cancelled-admin-notify.html`
- Create: `apps/backend/src/modules/notifications/templates/booking-reminder.html`
- Create: `apps/backend/src/modules/notifications/templates/contact-message-alert.html`

- [ ] **Step 1: Template `booking-confirmed.html`** (modèle de référence pour les autres)

```html
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"></head>
<body style="font-family: Inter, system-ui, sans-serif; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-family: Georgia, serif; font-size: 24px;">{{brandName}}</h1>
  <h2>Votre table est confirmée</h2>
  <p>Bonjour {{clientName}},</p>
  <p>Nous confirmons votre réservation pour <strong>{{partySize}} couverts</strong> le <strong>{{dateFormatted}}</strong> à <strong>{{timeFormatted}}</strong> ({{serviceWindowLabel}}).</p>
  {{#notes}}<p><em>Vos notes :</em> {{notes}}</p>{{/notes}}
  <p>Adresse : {{contactAddress}} · Tél : {{contactPhone}}</p>
  <p>En cas d'imprévu, vous pouvez annuler en cliquant ici : <a href="{{cancelUrl}}">Annuler la réservation</a></p>
  <p>Au plaisir de vous accueillir !</p>
  <p style="color: #888; font-size: 12px; margin-top: 32px;">{{brandName}} — {{contactAddress}}</p>
</body>
</html>
```

- [ ] **Step 2: Templates restants (8)**

Créer chaque fichier sur le même modèle : `<h1>{{brandName}}</h1>` + `<h2>` titre du mail + `<p>` corps + footer. Variables interpolées par template :
- `booking-pending.html` : "Demande reçue, validation sous 24h", liste les détails, mentionne le cancelUrl.
- `booking-admin-alert.html` : "Nouvelle réservation : {{partySize}} couverts le {{dateFormatted}} à {{timeFormatted}}" + lien `{{adminUrl}}/admin/bookings/{{id}}`.
- `booking-confirmed-after-pending.html` : "Votre demande est confirmée" + détails + cancelUrl.
- `booking-cancelled-by-admin.html` : "Nous sommes désolés…" + cancelReason si fourni.
- `booking-cancelled-by-client.html` : "Annulation confirmée".
- `booking-cancelled-admin-notify.html` : "Le client {{clientName}} a annulé la résa du {{dateFormatted}}".
- `booking-reminder.html` : "Rendez-vous demain à {{timeFormatted}}" + détails + cancelUrl.
- `contact-message-alert.html` : "Nouveau message de {{name}} ({{email}})" + `{{message}}`.

(Chaque template fait ~25-35 lignes HTML, structure identique au premier.)

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/modules/notifications/templates/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(notifications): 9 templates HTML"
```

### Task M4.7: NotificationsService — moteur de rendu et dispatch

**Files:**
- Create: `apps/backend/src/modules/notifications/notifications.service.ts`
- Create: `apps/backend/src/modules/notifications/notifications.service.spec.ts`

- [ ] **Step 1: Tests**

```ts
// notifications.service.spec.ts
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailerService } from './mailer/mailer.service';
import { SettingsService } from '../settings/settings.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mailer: { send: jest.Mock };
  let settings: any;
  let config: any;

  beforeEach(async () => {
    mailer = { send: jest.fn().mockResolvedValue(undefined) };
    settings = {
      getBrandName: jest.fn().mockResolvedValue('La Rencontre'),
      getContactAddress: jest.fn().mockResolvedValue('1 rue X'),
      getContactPhone: jest.fn().mockResolvedValue('05 00'),
    };
    config = { get: jest.fn((k: string) => k === 'ADMIN_EMAIL' ? 'admin@x.fr' : k === 'FRONTEND_URL' ? 'http://localhost:3100' : '') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: MailerService, useValue: mailer },
        { provide: SettingsService, useValue: settings },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = moduleRef.get(NotificationsService);
  });

  it('onBookingCreated CONFIRMED envoie booking-confirmed au client + admin-alert', async () => {
    await service.onBookingCreated({
      id: 'b1', status: 'CONFIRMED', clientName: 'Alice', clientEmail: 'a@b.fr',
      partySize: 2, date: new Date('2026-05-10T12:30:00Z'),
      serviceWindow: { label: 'Service Midi' }, notes: null,
    } as any);
    expect(mailer.send).toHaveBeenCalledTimes(2);
    const subjects = mailer.send.mock.calls.map((c: any[]) => c[0].subject);
    expect(subjects.some((s: string) => /confirmée/i.test(s))).toBe(true);
    expect(subjects.some((s: string) => /nouvelle/i.test(s))).toBe(true);
  });

  it('onBookingCreated PENDING envoie booking-pending au client + admin-alert', async () => {
    await service.onBookingCreated({
      id: 'b2', status: 'PENDING', clientName: 'Bob', clientEmail: 'b@c.fr',
      partySize: 12, date: new Date('2026-05-10T19:30:00Z'),
      serviceWindow: { label: 'Service Soir' }, notes: 'anniversaire',
    } as any);
    expect(mailer.send).toHaveBeenCalledTimes(2);
    expect(mailer.send.mock.calls[0][0].subject).toMatch(/demande/i);
  });

  it('onContactMessage envoie alerte admin', async () => {
    await service.onContactMessage({ name: 'X', email: 'x@x.fr', message: 'Hello' } as any);
    expect(mailer.send).toHaveBeenCalledTimes(1);
    expect(mailer.send.mock.calls[0][0].to).toBe('admin@x.fr');
  });
});
```

- [ ] **Step 2: Service**

```ts
// notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MailerService } from './mailer/mailer.service';
import { SettingsService } from '../settings/settings.service';
import { EmailTemplate } from './mailer/types';

const TEMPLATES_DIR = join(__dirname, 'templates');

function render(html: string, data: Record<string, any>): string {
  return html
    .replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, body) => data[key] ? body : '')
    .replace(/\{\{(\w+)\}\}/g, (_, key) => (data[key] ?? '').toString());
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly templates = new Map<EmailTemplate, string>();

  constructor(
    private mailer: MailerService,
    private settings: SettingsService,
    private config: ConfigService,
  ) {
    const names: EmailTemplate[] = [
      'booking-confirmed', 'booking-pending', 'booking-admin-alert',
      'booking-confirmed-after-pending', 'booking-cancelled-by-admin',
      'booking-cancelled-by-client', 'booking-cancelled-admin-notify',
      'booking-reminder', 'contact-message-alert',
    ];
    for (const n of names) {
      try { this.templates.set(n, readFileSync(join(TEMPLATES_DIR, `${n}.html`), 'utf8')); }
      catch (e) { this.logger.warn(`Template ${n}.html introuvable`); }
    }
  }

  private async commonVars(): Promise<Record<string, any>> {
    return {
      brandName: await this.settings.getBrandName(),
      contactAddress: await this.settings.getContactAddress(),
      contactPhone: await this.settings.getContactPhone(),
      adminUrl: this.config.get('FRONTEND_URL', 'http://localhost:3100'),
    };
  }

  private bookingVars(b: any) {
    const date = new Date(b.date);
    return {
      id: b.id,
      clientName: b.clientName,
      partySize: b.partySize,
      notes: b.notes ?? '',
      dateFormatted: date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      timeFormatted: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      serviceWindowLabel: b.serviceWindow?.label ?? '',
      cancelUrl: `${this.config.get('FRONTEND_URL', 'http://localhost:3100')}/reservation/${b.cancelToken}/cancel`,
    };
  }

  private async sendTpl(tpl: EmailTemplate, to: string, subject: string, data: Record<string, any>) {
    const html = this.templates.get(tpl);
    if (!html) { this.logger.warn(`Skip ${tpl}: template manquant`); return; }
    await this.mailer.send({ to, subject, html: render(html, data) });
  }

  async onBookingCreated(b: any) {
    const common = await this.commonVars();
    const vars = { ...common, ...this.bookingVars(b) };
    if (b.status === 'CONFIRMED') {
      await this.sendTpl('booking-confirmed', b.clientEmail, `Réservation confirmée — ${common.brandName}`, vars);
    } else {
      await this.sendTpl('booking-pending', b.clientEmail, `Demande de réservation reçue — ${common.brandName}`, vars);
    }
    await this.sendTpl('booking-admin-alert', this.config.get('ADMIN_EMAIL', ''),
      `Nouvelle réservation : ${b.partySize} couverts le ${vars.dateFormatted}`, vars);
  }

  async onBookingConfirmedByAdmin(b: any) {
    const common = await this.commonVars();
    const vars = { ...common, ...this.bookingVars(b) };
    await this.sendTpl('booking-confirmed-after-pending', b.clientEmail, `Réservation confirmée — ${common.brandName}`, vars);
  }

  async onBookingCancelled(b: any, by: 'admin' | 'client') {
    const common = await this.commonVars();
    const vars = { ...common, ...this.bookingVars(b) };
    if (by === 'admin') {
      await this.sendTpl('booking-cancelled-by-admin', b.clientEmail, `Annulation de votre réservation — ${common.brandName}`, vars);
    } else {
      await this.sendTpl('booking-cancelled-by-client', b.clientEmail, `Annulation confirmée — ${common.brandName}`, vars);
      await this.sendTpl('booking-cancelled-admin-notify', this.config.get('ADMIN_EMAIL', ''),
        `Annulation client : ${b.clientName} le ${vars.dateFormatted}`, vars);
    }
  }

  async onBookingReminder(b: any) {
    const common = await this.commonVars();
    const vars = { ...common, ...this.bookingVars(b) };
    await this.sendTpl('booking-reminder', b.clientEmail,
      `Rappel : votre table demain à ${vars.timeFormatted} — ${common.brandName}`, vars);
  }

  async onContactMessage(m: { name: string; email: string; message: string }) {
    const common = await this.commonVars();
    await this.sendTpl('contact-message-alert', this.config.get('ADMIN_EMAIL', ''),
      `Nouveau message de ${m.name}`, { ...common, ...m });
  }
}
```

- [ ] **Step 3: Tests passent**

```bash
pnpm --filter backend test -- notifications.service.spec.ts
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/modules/notifications/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(notifications): service + 9 templates dispatch"
```

### Task M4.8: Cron J-1 reminder

**Files:**
- Create: `apps/backend/src/modules/notifications/jobs/reminder.cron.ts`

- [ ] **Step 1: Installer si absent**

```bash
pnpm --filter backend add @nestjs/schedule
```

- [ ] **Step 2: Cron**

```ts
// notifications/jobs/reminder.cron.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class ReminderCron {
  private readonly logger = new Logger(ReminderCron.name);

  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  @Cron('0 10 * * *', { timeZone: 'Europe/Paris' })
  async run() {
    const now = new Date();
    const lower = new Date(now.getTime() + 23 * 3600 * 1000);
    const upper = new Date(now.getTime() + 25 * 3600 * 1000);
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        date: { gte: lower, lte: upper },
        reminderSentAt: null,
      },
      include: { serviceWindow: true },
    });
    this.logger.log(`Cron rappel J-1 : ${bookings.length} résa à notifier`);
    for (const b of bookings) {
      try {
        await this.notifications.onBookingReminder(b);
        await this.prisma.booking.update({ where: { id: b.id }, data: { reminderSentAt: new Date() } });
      } catch (e: any) {
        this.logger.error(`Échec rappel ${b.id}: ${e.message}`);
      }
    }
  }
}
```

### Task M4.9: NotificationsModule wiring + ScheduleModule global

**Files:**
- Create: `apps/backend/src/modules/notifications/notifications.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 1: Module**

```ts
// notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { MailerService, MAILER_PROVIDER } from './mailer/mailer.service';
import { NodemailerProvider } from './mailer/nodemailer.provider';
import { ResendProvider } from './mailer/resend.provider';
import { NotificationsService } from './notifications.service';
import { ReminderCron } from './jobs/reminder.cron';

@Module({
  imports: [PrismaModule, SettingsModule, ConfigModule],
  providers: [
    NotificationsService,
    MailerService,
    ReminderCron,
    {
      provide: MAILER_PROVIDER,
      useFactory: (config: any) => process.env.NODE_ENV === 'production'
        ? new ResendProvider(config)
        : new NodemailerProvider(config),
      inject: ['ConfigService'],
    },
  ],
  exports: [NotificationsService, MailerService],
})
export class NotificationsModule {}
```

> Note : `ConfigService` est importé via le token `'ConfigService'` ; si erreur Nest, utiliser `inject: [ConfigService]` (importé `from '@nestjs/config'`).

- [ ] **Step 2: Activer ScheduleModule globalement dans `app.module.ts`**

Dans `app.module.ts`, ajouter aux imports :

```ts
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    // … les autres modules
    ScheduleModule.forRoot(),
    NotificationsModule,
    // BookingsModule reste commenté jusqu'à fin M4
  ],
})
export class AppModule {}
```

- [ ] **Step 3: Décommenter `BookingsModule`** (toutes ses deps existent maintenant)

Dans `app.module.ts`, décommenter l'import de `BookingsModule` et l'inclure dans `imports`.

- [ ] **Step 4: Tester boot complet**

```bash
pnpm --filter backend dev &
sleep 15
curl -s http://localhost:3101/health
kill %1
```
Expected: réponse 200

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/notifications/ apps/backend/src/app.module.ts
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(notifications): module wired + ScheduleModule + bookings activé"
```

### Task M4.10: Test e2e booking + email en MailHog

- [ ] **Step 1: Démarrer le backend**

```bash
pnpm --filter backend dev &
sleep 15
```

- [ ] **Step 2: Créer une résa via curl**

```bash
TOMORROW=$(date -u -d "tomorrow" +%Y-%m-%dT12:30:00.000Z)
curl -s -X POST http://localhost:3101/bookings \
  -H 'Content-Type: application/json' \
  -d "{\"partySize\":2,\"date\":\"$TOMORROW\",\"clientName\":\"Test\",\"clientEmail\":\"test@example.fr\",\"clientPhone\":\"0600000000\"}" | jq
```
Expected: `data.status: "CONFIRMED"` + `data.cancelToken`

- [ ] **Step 3: Vérifier les mails dans MailHog**

```bash
curl -s http://localhost:8025/api/v2/messages | jq '.items | length'
```
Expected: `2` ou plus (mail client confirmé + mail admin alert)

- [ ] **Step 4: Stopper backend**

```bash
kill %1
```

### Task M4.11: Smoke complet M4 + milestone tag

- [ ] **Step 1: Tests backend complets**

```bash
pnpm --filter backend test
```
Expected: PASS, > 50 tests

- [ ] **Step 2: Build complet**

```bash
pnpm --filter backend build
```
Expected: build OK

- [ ] **Step 3: Milestone tag**

```bash
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit --allow-empty -m "milestone(M4): images PDF + notifications + cron J-1"
```

---

## Milestone 5 — Modules contenu (HomeSections, MenuDocuments, ContactMessages) (10 tâches)

**Output testable :** L'admin peut CRUD les 3 entités, drag-réordonner, et un POST public sur `/contact-messages` avec captcha valide stocke + déclenche email admin.

### Task M5.1: HomeSections — DTOs + service + tests

**Files:**
- Create: `apps/backend/src/modules/home-sections/dto/{create,update,reorder}.dto.ts`
- Create: `apps/backend/src/modules/home-sections/home-sections.service.ts`
- Create: `apps/backend/src/modules/home-sections/home-sections.service.spec.ts`

- [ ] **Step 1: DTOs**

```ts
// dto/create-home-section.dto.ts
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
export class CreateHomeSectionDto {
  @IsString() @Length(1, 120) title!: string;
  @IsString() @Length(1, 4000) body!: string;
  @IsOptional() @IsString() imageId?: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}
```

```ts
// dto/update-home-section.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateHomeSectionDto } from './create-home-section.dto';
export class UpdateHomeSectionDto extends PartialType(CreateHomeSectionDto) {}
```

```ts
// dto/reorder.dto.ts
import { IsArray, IsString } from 'class-validator';
export class ReorderHomeSectionsDto { @IsArray() @IsString({ each: true }) ids!: string[]; }
```

- [ ] **Step 2: Service**

```ts
// home-sections.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HomeSectionsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.homeSection.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { image: { select: { id: true, mimeType: true, width: true, height: true } } },
    });
  }

  findPublished() {
    return this.prisma.homeSection.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
      include: { image: { select: { id: true, mimeType: true, width: true, height: true } } },
    });
  }

  async create(dto: { title: string; body: string; imageId?: string; isPublished?: boolean }) {
    const max = await this.prisma.homeSection.aggregate({ _max: { sortOrder: true } });
    return this.prisma.homeSection.create({
      data: { ...dto, isPublished: dto.isPublished ?? true, sortOrder: (max._max.sortOrder ?? -1) + 1 },
    });
  }

  async update(id: string, dto: any) {
    try { return await this.prisma.homeSection.update({ where: { id }, data: dto }); }
    catch { throw new NotFoundException(); }
  }

  async remove(id: string) {
    try { return await this.prisma.homeSection.delete({ where: { id } }); }
    catch { throw new NotFoundException(); }
  }

  async reorder(ids: string[]) {
    await Promise.all(ids.map((id, idx) => this.prisma.homeSection.update({ where: { id }, data: { sortOrder: idx } })));
    return this.findAll();
  }
}
```

- [ ] **Step 3: Tests minimaux**

```ts
// home-sections.service.spec.ts
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { HomeSectionsService } from './home-sections.service';

describe('HomeSectionsService', () => {
  let service: HomeSectionsService;
  let prisma: any;
  beforeEach(async () => {
    prisma = { homeSection: { findMany: jest.fn(), aggregate: jest.fn().mockResolvedValue({ _max: { sortOrder: 1 } }), create: jest.fn(), update: jest.fn() } };
    const moduleRef = await Test.createTestingModule({
      providers: [HomeSectionsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(HomeSectionsService);
  });

  it('create assigne sortOrder = max + 1', async () => {
    prisma.homeSection.create.mockResolvedValue({ id: 's1', sortOrder: 2 });
    const r = await service.create({ title: 'X', body: 'Y' });
    expect(prisma.homeSection.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ sortOrder: 2 }),
    }));
  });

  it('reorder MAJ chaque section', async () => {
    prisma.homeSection.update.mockResolvedValue({});
    await service.reorder(['a', 'b', 'c']);
    expect(prisma.homeSection.update).toHaveBeenCalledTimes(3);
    expect(prisma.homeSection.update).toHaveBeenCalledWith({ where: { id: 'a' }, data: { sortOrder: 0 } });
  });
});
```

- [ ] **Step 4: Tests passent + commit**

```bash
pnpm --filter backend test -- home-sections.service.spec.ts
git add apps/backend/src/modules/home-sections/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(home-sections): service + DTOs + tests"
```

### Task M5.2: HomeSections — controller + module

**Files:**
- Create: `apps/backend/src/modules/home-sections/home-sections.controller.ts`
- Create: `apps/backend/src/modules/home-sections/home-sections.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 1: Controller**

```ts
// home-sections.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HomeSectionsService } from './home-sections.service';
import { CreateHomeSectionDto } from './dto/create-home-section.dto';
import { UpdateHomeSectionDto } from './dto/update-home-section.dto';
import { ReorderHomeSectionsDto } from './dto/reorder.dto';

@ApiTags('admin/home-sections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/home-sections')
export class HomeSectionsController {
  constructor(private svc: HomeSectionsService) {}
  @Get()              findAll()                                                              { return this.svc.findAll(); }
  @Post()             create(@Body() dto: CreateHomeSectionDto)                              { return this.svc.create(dto); }
  @Patch('reorder')   reorder(@Body() dto: ReorderHomeSectionsDto)                           { return this.svc.reorder(dto.ids); }
  @Patch(':id')       update(@Param('id') id: string, @Body() dto: UpdateHomeSectionDto)    { return this.svc.update(id, dto); }
  @Delete(':id')      remove(@Param('id') id: string)                                        { return this.svc.remove(id); }
}
```

- [ ] **Step 2: Module + wire + commit**

```ts
// home-sections.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { HomeSectionsController } from './home-sections.controller';
import { HomeSectionsService } from './home-sections.service';

@Module({
  imports: [PrismaModule],
  controllers: [HomeSectionsController],
  providers: [HomeSectionsService],
  exports: [HomeSectionsService],
})
export class HomeSectionsModule {}
```

Wire dans `app.module.ts`. Commit :

```bash
git add apps/backend/src/modules/home-sections/ apps/backend/src/app.module.ts
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(home-sections): controller + module wired"
```

### Task M5.3: MenuDocuments — DTOs + service + tests

**Files:**
- Create: `apps/backend/src/modules/menu-documents/dto/{create,update,reorder}.dto.ts`
- Create: `apps/backend/src/modules/menu-documents/menu-documents.service.ts`
- Create: `apps/backend/src/modules/menu-documents/menu-documents.service.spec.ts`

- [ ] **Step 1: DTOs**

```ts
// dto/create-menu-document.dto.ts
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
export class CreateMenuDocumentDto {
  @IsString() @Length(1, 120) title!: string;
  @IsOptional() @IsString() @Length(0, 1000) description?: string;
  @IsString() fileId!: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}
```

```ts
// dto/update-menu-document.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateMenuDocumentDto } from './create-menu-document.dto';
export class UpdateMenuDocumentDto extends PartialType(CreateMenuDocumentDto) {}
```

```ts
// dto/reorder.dto.ts
import { IsArray, IsString } from 'class-validator';
export class ReorderMenuDocumentsDto { @IsArray() @IsString({ each: true }) ids!: string[]; }
```

- [ ] **Step 2: Service** (structure identique à HomeSectionsService, avec `image` (fileId) inclus)

```ts
// menu-documents.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MenuDocumentsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.menuDocument.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { file: { select: { id: true, mimeType: true, size: true } } },
    });
  }

  findPublished() {
    return this.prisma.menuDocument.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
      include: { file: { select: { id: true, mimeType: true, size: true } } },
    });
  }

  async create(dto: { title: string; description?: string; fileId: string; isPublished?: boolean }) {
    const max = await this.prisma.menuDocument.aggregate({ _max: { sortOrder: true } });
    return this.prisma.menuDocument.create({
      data: { ...dto, isPublished: dto.isPublished ?? true, sortOrder: (max._max.sortOrder ?? -1) + 1 },
    });
  }

  async update(id: string, dto: any) {
    try { return await this.prisma.menuDocument.update({ where: { id }, data: dto }); }
    catch { throw new NotFoundException(); }
  }

  async remove(id: string) {
    try { return await this.prisma.menuDocument.delete({ where: { id } }); }
    catch { throw new NotFoundException(); }
  }

  async reorder(ids: string[]) {
    await Promise.all(ids.map((id, idx) => this.prisma.menuDocument.update({ where: { id }, data: { sortOrder: idx } })));
    return this.findAll();
  }
}
```

- [ ] **Step 3: Tests minimaux** (sur le modèle de M5.1.Step 3, adapter les noms)

- [ ] **Step 4: Tests passent + commit**

```bash
pnpm --filter backend test -- menu-documents.service.spec.ts
git add apps/backend/src/modules/menu-documents/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(menu-documents): service + DTOs + tests"
```

### Task M5.4: MenuDocuments — controller + module + wire

(Structure miroir de M5.2, route base `/admin/menu-documents`.)

- [ ] **Step 1: Créer `menu-documents.controller.ts` et `.module.ts`** (identiques à HomeSections, remplacer les noms)

- [ ] **Step 2: Wire dans `app.module.ts`** + commit

```bash
git add apps/backend/src/modules/menu-documents/ apps/backend/src/app.module.ts
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(menu-documents): controller + module wired"
```

### Task M5.5: ContactMessages — captcha service + DTO

**Files:**
- Create: `apps/backend/src/modules/contact-messages/captcha.service.ts`
- Create: `apps/backend/src/modules/contact-messages/captcha.service.spec.ts`
- Create: `apps/backend/src/modules/contact-messages/dto/create-message.dto.ts`

- [ ] **Step 1: CaptchaService — TDD**

Tests :

```ts
// captcha.service.spec.ts
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CaptchaService } from './captcha.service';

describe('CaptchaService', () => {
  let service: CaptchaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CaptchaService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-secret-32-chars-min-please!!') } },
      ],
    }).compile();
    service = moduleRef.get(CaptchaService);
  });

  it('issue retourne question + token', () => {
    const r = service.issue();
    expect(r.question).toMatch(/\d+ \+ \d+/);
    expect(r.token).toBeTruthy();
  });

  it('verify accepte une réponse correcte', () => {
    const r = service.issue();
    const expected = eval(r.question);
    expect(service.verify(r.token, String(expected))).toBe(true);
  });

  it('verify refuse une mauvaise réponse', () => {
    const r = service.issue();
    expect(service.verify(r.token, '0')).toBe(false);
  });

  it('verify refuse un token corrompu', () => {
    expect(service.verify('bad.token.here', '5')).toBe(false);
  });
});
```

Service :

```ts
// captcha.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';

@Injectable()
export class CaptchaService {
  private readonly secret: string;
  constructor(config: ConfigService) {
    this.secret = config.get('JWT_SECRET') || 'change-me-32-chars-min!!';
  }

  issue(): { question: string; token: string } {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    const expected = a + b;
    const expiresAt = Date.now() + 10 * 60_000;
    const payload = `${expected}.${expiresAt}`;
    const sig = createHmac('sha256', this.secret).update(payload).digest('hex').slice(0, 16);
    return { question: `${a} + ${b}`, token: `${payload}.${sig}` };
  }

  verify(token: string, answer: string): boolean {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [expected, expiresAt, sig] = parts;
    const recomputed = createHmac('sha256', this.secret).update(`${expected}.${expiresAt}`).digest('hex').slice(0, 16);
    if (recomputed !== sig) return false;
    if (Number(expiresAt) < Date.now()) return false;
    return String(expected) === String(answer).trim();
  }
}
```

DTO :

```ts
// dto/create-message.dto.ts
import { IsEmail, IsString, Length } from 'class-validator';

export class CreateMessageDto {
  @IsString() @Length(2, 80) name!: string;
  @IsEmail() email!: string;
  @IsString() @Length(1, 2000) message!: string;
  @IsString() captchaToken!: string;
  @IsString() captchaAnswer!: string;
}
```

- [ ] **Step 2: Tests passent + commit**

```bash
pnpm --filter backend test -- captcha.service.spec.ts
git add apps/backend/src/modules/contact-messages/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(contact-messages): captcha service HMAC + DTO"
```

### Task M5.6: ContactMessagesService + tests

**Files:**
- Create: `apps/backend/src/modules/contact-messages/contact-messages.service.ts`
- Create: `apps/backend/src/modules/contact-messages/contact-messages.service.spec.ts`

- [ ] **Step 1: Tests**

```ts
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CaptchaService } from './captcha.service';
import { ContactMessagesService } from './contact-messages.service';

describe('ContactMessagesService', () => {
  let service: ContactMessagesService;
  let prisma: any;
  let notif: any;
  let captcha: any;

  beforeEach(async () => {
    prisma = { contactMessage: { create: jest.fn().mockResolvedValue({ id: 'm1' }), findMany: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() } };
    notif = { onContactMessage: jest.fn() };
    captcha = { verify: jest.fn().mockReturnValue(true) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ContactMessagesService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notif },
        { provide: CaptchaService, useValue: captcha },
      ],
    }).compile();
    service = moduleRef.get(ContactMessagesService);
  });

  it('create stocke + alerte admin si captcha OK', async () => {
    await service.create({ name: 'X', email: 'x@x.fr', message: 'Hello', captchaToken: 't', captchaAnswer: '5' });
    expect(prisma.contactMessage.create).toHaveBeenCalled();
    expect(notif.onContactMessage).toHaveBeenCalled();
  });

  it('create rejette si captcha invalide', async () => {
    captcha.verify.mockReturnValue(false);
    await expect(service.create({ name: 'X', email: 'x@x.fr', message: 'Hi', captchaToken: 't', captchaAnswer: '0' }))
      .rejects.toThrow(BadRequestException);
  });
});
```

- [ ] **Step 2: Service**

```ts
// contact-messages.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CaptchaService } from './captcha.service';

@Injectable()
export class ContactMessagesService {
  constructor(private prisma: PrismaService, private notif: NotificationsService, private captcha: CaptchaService) {}

  async create(dto: { name: string; email: string; message: string; captchaToken: string; captchaAnswer: string }) {
    if (!this.captcha.verify(dto.captchaToken, dto.captchaAnswer)) {
      throw new BadRequestException('Captcha invalide');
    }
    const created = await this.prisma.contactMessage.create({
      data: { name: dto.name, email: dto.email, message: dto.message },
    });
    await this.notif.onContactMessage({ name: dto.name, email: dto.email, message: dto.message });
    return { id: created.id };
  }

  async findAll(page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      this.prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.contactMessage.count(),
    ]);
    return { items, total, page, pageSize };
  }

  async setRead(id: string, isRead: boolean) {
    try { return await this.prisma.contactMessage.update({ where: { id }, data: { isRead } }); }
    catch { throw new NotFoundException(); }
  }

  async remove(id: string) {
    try { return await this.prisma.contactMessage.delete({ where: { id } }); }
    catch { throw new NotFoundException(); }
  }
}
```

- [ ] **Step 3: Tests passent + commit**

```bash
pnpm --filter backend test -- contact-messages.service.spec.ts
git add apps/backend/src/modules/contact-messages/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(contact-messages): service + tests"
```

### Task M5.7: ContactMessages — controller + module + wire + captcha-issue endpoint

**Files:**
- Create: `apps/backend/src/modules/contact-messages/contact-messages.controller.ts`
- Create: `apps/backend/src/modules/contact-messages/contact-messages.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 1: Controller**

```ts
// contact-messages.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ContactMessagesService } from './contact-messages.service';
import { CaptchaService } from './captcha.service';
import { CreateMessageDto } from './dto/create-message.dto';

@ApiTags('contact-messages')
@Controller()
export class ContactMessagesController {
  constructor(private svc: ContactMessagesService, private captcha: CaptchaService) {}

  @Public()
  @Get('contact-messages/captcha')
  issueCaptcha() { return this.captcha.issue(); }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('contact-messages')
  create(@Body() dto: CreateMessageDto) { return this.svc.create(dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get('admin/contact-messages')
  findAll(@Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    return this.svc.findAll(parseInt(page, 10), parseInt(pageSize, 10));
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch('admin/contact-messages/:id')
  setRead(@Param('id') id: string, @Body() body: { isRead: boolean }) {
    return this.svc.setRead(id, body.isRead);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Delete('admin/contact-messages/:id')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
```

- [ ] **Step 2: Module**

```ts
// contact-messages.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ContactMessagesController } from './contact-messages.controller';
import { ContactMessagesService } from './contact-messages.service';
import { CaptchaService } from './captcha.service';

@Module({
  imports: [PrismaModule, NotificationsModule, ConfigModule],
  controllers: [ContactMessagesController],
  providers: [ContactMessagesService, CaptchaService],
  exports: [ContactMessagesService],
})
export class ContactMessagesModule {}
```

- [ ] **Step 3: Wire `app.module.ts`** + commit

```bash
git add apps/backend/src/modules/contact-messages/ apps/backend/src/app.module.ts
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(contact-messages): controller + module wired (avec captcha-issue endpoint)"
```

### Task M5.8: Smoke e2e contact form

- [ ] **Step 1: Démarrer backend**

```bash
pnpm --filter backend dev &
sleep 12
```

- [ ] **Step 2: Récupérer un captcha + soumettre un message**

```bash
RESP=$(curl -s http://localhost:3101/contact-messages/captcha)
TOKEN=$(echo "$RESP" | jq -r '.data.token')
QUESTION=$(echo "$RESP" | jq -r '.data.question')
ANSWER=$(echo "$QUESTION" | awk '{print $1 + $3}')
curl -s -X POST http://localhost:3101/contact-messages \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Test\",\"email\":\"t@t.fr\",\"message\":\"Hello\",\"captchaToken\":\"$TOKEN\",\"captchaAnswer\":\"$ANSWER\"}" | jq
```
Expected: `data.id` retourné

- [ ] **Step 3: Vérifier en DB et MailHog**

```bash
docker exec -e PGPASSWORD=booking123 booking_resto_db psql -U booking -d booking_resto -c "SELECT count(*) FROM contact_messages;"
curl -s http://localhost:8025/api/v2/messages | jq '.items | length'
kill %1
```
Expected: count >= 1, mailhog count >= 1

### Task M5.9: Tests d'ensemble M5

- [ ] **Step 1: Tests backend complets**

```bash
pnpm --filter backend test
```
Expected: tous PASS, > 70 tests

### Task M5.10: Milestone tag

```bash
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit --allow-empty -m "milestone(M5): home-sections + menu-documents + contact-messages"
```

---

## Milestone 6 — Public endpoints + Stats (5 tâches)

**Output testable :** `/public/*` renvoie tout ce dont le frontend SSR a besoin en quelques appels, `/stats` renvoie les KPI couverts du dashboard.

### Task M6.1: PublicController — réécriture complète

**Files:**
- Modify (rewrite): `apps/backend/src/modules/public/public.controller.ts`
- Modify (rewrite): `apps/backend/src/modules/public/public.module.ts`

- [ ] **Step 1: Module**

```ts
// public.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { ServiceWindowsModule } from '../service-windows/service-windows.module';
import { HomeSectionsModule } from '../home-sections/home-sections.module';
import { MenuDocumentsModule } from '../menu-documents/menu-documents.module';
import { BookingsModule } from '../bookings/bookings.module';
import { PublicController } from './public.controller';

@Module({
  imports: [PrismaModule, SettingsModule, ServiceWindowsModule, HomeSectionsModule, MenuDocumentsModule, BookingsModule],
  controllers: [PublicController],
})
export class PublicModule {}
```

- [ ] **Step 2: Controller**

```ts
// public.controller.ts
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
  getSchedule() { return this.windows.findAll().then(ws => ws.filter(w => w.isActive)); }

  @Get('availability-slots')
  getSlots(@Query('date') date: string, @Query('partySize') partySize: string) {
    return this.bookings.generateSlots(date, parseInt(partySize, 10));
  }
}
```

- [ ] **Step 3: Wire dans `app.module.ts`** (déjà présent) + commit

```bash
git add apps/backend/src/modules/public/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(public): endpoints SSR (site, home-sections, menu-documents, schedule, availability-slots)"
```

### Task M6.2: StatsService — adapté couverts

**Files:**
- Modify (rewrite): `apps/backend/src/modules/stats/stats.service.ts`
- Modify: `apps/backend/src/modules/stats/stats.controller.ts`
- Modify: `apps/backend/src/modules/stats/stats.module.ts`

- [ ] **Step 1: Service**

```ts
// stats.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService, private settings: SettingsService) {}

  private startOfDayUTC(d: Date) { const x = new Date(d); x.setUTCHours(0,0,0,0); return x; }
  private endOfDayUTC(d: Date)   { const x = new Date(d); x.setUTCHours(23,59,59,999); return x; }

  async overview() {
    const today = new Date();
    const dayStart = this.startOfDayUTC(today);
    const dayEnd = this.endOfDayUTC(today);

    const todayBookings = await this.prisma.booking.findMany({
      where: { date: { gte: dayStart, lte: dayEnd }, status: { in: ['CONFIRMED', 'PENDING'] } },
      include: { serviceWindow: true },
    });
    const couvertsToday = todayBookings.reduce((s, b) => s + b.partySize, 0);
    const pendingCount = todayBookings.filter(b => b.status === 'PENDING').length;

    // Capacité par service (somme partySize / capacityMax * 100)
    const capacityMax = await this.settings.getCapacityMax();
    const midi = todayBookings.filter(b => b.serviceWindow?.label?.toLowerCase().includes('midi'))
      .reduce((s, b) => s + b.partySize, 0);
    const soir = todayBookings.filter(b => b.serviceWindow?.label?.toLowerCase().includes('soir'))
      .reduce((s, b) => s + b.partySize, 0);
    const tauxMidi = capacityMax > 0 ? Math.round((midi / capacityMax) * 100) : 0;
    const tauxSoir = capacityMax > 0 ? Math.round((soir / capacityMax) * 100) : 0;

    // Chart 7 jours
    const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 6);
    const weekBookings = await this.prisma.booking.findMany({
      where: { date: { gte: this.startOfDayUTC(sevenDaysAgo), lte: dayEnd }, status: { in: ['CONFIRMED', 'PENDING'] } },
      select: { date: true, partySize: true },
    });
    const chart7d: { date: string; couverts: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const dayKey = d.toISOString().slice(0, 10);
      const sum = weekBookings.filter(b => b.date.toISOString().slice(0, 10) === dayKey)
        .reduce((s, b) => s + b.partySize, 0);
      chart7d.push({ date: dayKey, couverts: sum });
    }

    return {
      couvertsToday,
      bookingsToday: todayBookings.length,
      pendingCount,
      tauxRemplissageMidi: tauxMidi,
      tauxRemplissageSoir: tauxSoir,
      chart7d,
    };
  }

  async byPeriod(from: string, to: string) {
    const items = await this.prisma.booking.findMany({
      where: { date: { gte: new Date(from), lte: new Date(to) }, status: { in: ['CONFIRMED', 'PENDING'] } },
      select: { date: true, partySize: true },
    });
    const total = items.reduce((s, b) => s + b.partySize, 0);
    return { total, count: items.length, from, to };
  }
}
```

- [ ] **Step 2: Controller + Module**

```ts
// stats.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StatsService } from './stats.service';

@ApiTags('admin/stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/stats')
export class StatsController {
  constructor(private stats: StatsService) {}
  @Get('overview') overview() { return this.stats.overview(); }
  @Get('period')   period(@Query('from') from: string, @Query('to') to: string) { return this.stats.byPeriod(from, to); }
}
```

```ts
// stats.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
```

- [ ] **Step 3: Wire `app.module.ts` + commit**

```bash
git add apps/backend/src/modules/stats/ apps/backend/src/app.module.ts
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(stats): adapté couverts midi/soir + chart 7j"
```

### Task M6.3: Smoke e2e des routes publiques

- [ ] **Step 1: Démarrer backend, tester /public/*  + /admin/stats/overview**

```bash
pnpm --filter backend dev &
sleep 12

curl -s http://localhost:3101/public/site | jq '.data.brand_name'
curl -s http://localhost:3101/public/home-sections | jq '.data | length'
curl -s http://localhost:3101/public/schedule | jq '.data | length'
curl -s "http://localhost:3101/public/availability-slots?date=$(date -u -d 'tomorrow' +%Y-%m-%d)&partySize=2" | jq '.data | length'

TOKEN=$(curl -s -X POST http://localhost:3101/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@example.fr","password":"Admin1234!"}' | jq -r '.data.accessToken')
curl -s http://localhost:3101/admin/stats/overview -H "Authorization: Bearer $TOKEN" | jq '.data.couvertsToday'

kill %1
```
Expected: `"Mon Restaurant"`, `2` (sections seedées), `2` (windows seedées), nombre > 0 si demain est un mar-ven, `0` ou plus pour couvertsToday.

### Task M6.4: Tests backend full + build

- [ ] **Step 1: Lancer tous les tests**

```bash
pnpm --filter backend test
pnpm --filter backend build
```
Expected: tous PASS, build OK

### Task M6.5: Milestone tag M6 (= backend complet)

```bash
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit --allow-empty -m "milestone(M6): backend booking-resto complet (public + stats)"
```

---

## Milestone 7 — Frontend public Nuxt 3 (16 tâches)

**Output testable :** http://localhost:3100/ affiche le hero + N HomeSections + bloc contact, http://localhost:3100/menu liste les MenuDocuments, http://localhost:3100/reservation permet de créer une résa qui apparaît dans la DB.

### Task M7.1: Nettoyer les pages héritées + theming default

**Files:**
- Delete: `apps/frontend/pages/[slug]/` (toute la zone publique slug-based)
- Delete: `apps/frontend/components/ServiceCard.vue`
- Modify: `apps/frontend/tailwind.config.ts`
- Modify: `apps/frontend/app.vue`

- [ ] **Step 1: Supprimer pages multi-tenant héritées**

```bash
rm -rf apps/frontend/pages/[slug]
rm -f apps/frontend/components/ServiceCard.vue
```

- [ ] **Step 2: `tailwind.config.ts`** — palette resto + polices

```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./components/**/*.{vue,ts}', './layouts/**/*.vue', './pages/**/*.vue', './app.vue'],
  theme: {
    extend: {
      colors: {
        bg:     '#FAF7F2',
        ink:    '#1A1A1A',
        accent: '#8B6F47',
        muted:  '#6B6B6B',
        line:   '#E8E0D2',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 3: `app.vue`** — wrapper layout + injection Google Fonts

```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap' },
  ],
});
</script>
```

- [ ] **Step 4: Commit**

```bash
git add -A
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "chore(frontend): clean héritage + theming resto default"
```

### Task M7.2: Layout `default.vue` (public) avec header/footer

**Files:**
- Create: `apps/frontend/layouts/default.vue`
- Create: `apps/frontend/components/public/SiteHeader.vue`
- Create: `apps/frontend/components/public/SiteFooter.vue`

- [ ] **Step 1: Layout default**

```vue
<!-- layouts/default.vue -->
<template>
  <div class="min-h-screen bg-bg text-ink font-sans flex flex-col">
    <SiteHeader :brand="site?.brand_name ?? 'Mon Restaurant'" />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter :brand="site?.brand_name ?? 'Mon Restaurant'" :instagram="site?.instagram_url" />
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const { data: site } = await useFetch<Record<string, string>>(`${config.public.apiUrl}/public/site`, {
  transform: (raw: any) => raw?.data ?? raw,
});
</script>
```

- [ ] **Step 2: SiteHeader**

```vue
<!-- components/public/SiteHeader.vue -->
<template>
  <header class="sticky top-0 z-30 bg-bg/95 backdrop-blur border-b border-line">
    <nav class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <NuxtLink to="/" class="font-display text-xl font-semibold">{{ brand }}</NuxtLink>
      <ul class="hidden md:flex gap-8 text-sm">
        <li><NuxtLink to="/" class="hover:text-accent">Accueil</NuxtLink></li>
        <li><NuxtLink to="/menu" class="hover:text-accent">Menu</NuxtLink></li>
        <li><NuxtLink to="/reservation" class="hover:text-accent">Réserver</NuxtLink></li>
        <li><NuxtLink to="/#contact" class="hover:text-accent">Contact</NuxtLink></li>
      </ul>
      <button class="md:hidden" @click="open = !open" aria-label="Menu">☰</button>
    </nav>
    <div v-if="open" class="md:hidden border-t border-line bg-bg px-6 py-4">
      <NuxtLink to="/" @click="open=false" class="block py-2">Accueil</NuxtLink>
      <NuxtLink to="/menu" @click="open=false" class="block py-2">Menu</NuxtLink>
      <NuxtLink to="/reservation" @click="open=false" class="block py-2">Réserver</NuxtLink>
      <NuxtLink to="/#contact" @click="open=false" class="block py-2">Contact</NuxtLink>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{ brand: string }>();
const open = ref(false);
</script>
```

- [ ] **Step 3: SiteFooter**

```vue
<!-- components/public/SiteFooter.vue -->
<template>
  <footer class="border-t border-line py-8 text-center text-sm text-muted">
    <p>© {{ new Date().getFullYear() }} {{ brand }} — Site réalisé par <a href="https://www.nmf-agence.com" class="hover:text-accent">NMF Agence</a></p>
    <a v-if="instagram" :href="instagram" target="_blank" rel="noopener" class="inline-block mt-2 hover:text-accent">Instagram</a>
  </footer>
</template>

<script setup lang="ts">
defineProps<{ brand: string; instagram?: string }>();
</script>
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/layouts/default.vue apps/frontend/components/public/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(frontend): layout default + header + footer publics"
```

### Task M7.3: Composant Hero

**Files:**
- Create: `apps/frontend/components/public/Hero.vue`

- [ ] **Step 1: Hero**

```vue
<!-- components/public/Hero.vue -->
<template>
  <section class="relative h-[80vh] min-h-[500px] w-full overflow-hidden">
    <img v-if="imageUrl" :src="imageUrl" :alt="title" class="absolute inset-0 w-full h-full object-cover" />
    <div class="absolute inset-0 bg-black/40"></div>
    <div class="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-6">
      <h1 class="font-display text-5xl md:text-7xl font-semibold mb-4">{{ title }}</h1>
      <p v-if="subtitle" class="text-lg md:text-xl max-w-2xl mb-8 opacity-90">{{ subtitle }}</p>
      <div class="flex gap-4">
        <NuxtLink to="/menu" class="px-6 py-3 bg-white text-ink rounded-sm hover:bg-accent hover:text-white transition">Menu</NuxtLink>
        <NuxtLink to="/reservation" class="px-6 py-3 border border-white text-white rounded-sm hover:bg-white hover:text-ink transition">Réserver</NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ title: string; subtitle?: string; imageId?: string | null }>();
const config = useRuntimeConfig();
const imageUrl = computed(() => props.imageId ? `${config.public.apiUrl}/images/${props.imageId}` : null);
</script>
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/components/public/Hero.vue
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(frontend): Hero component"
```

### Task M7.4: Composant HomeSection (alterné G/D auto)

**Files:**
- Create: `apps/frontend/components/public/HomeSection.vue`

```vue
<!-- components/public/HomeSection.vue -->
<template>
  <section class="py-20 px-6">
    <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center" :class="reversed ? 'md:[&>:first-child]:order-2' : ''">
      <div>
        <img v-if="imageUrl" :src="imageUrl" :alt="section.title" class="w-full aspect-[4/5] object-cover" />
      </div>
      <div>
        <h2 class="font-display text-4xl mb-6">{{ section.title }}</h2>
        <div class="prose prose-stone whitespace-pre-line text-base leading-relaxed">{{ section.body }}</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface SectionData { id: string; title: string; body: string; image?: { id: string } | null }
const props = defineProps<{ section: SectionData; index: number }>();
const config = useRuntimeConfig();
const reversed = computed(() => props.index % 2 === 1);
const imageUrl = computed(() => props.section.image?.id ? `${config.public.apiUrl}/images/${props.section.image.id}` : null);
</script>
```

- [ ] **Step 1: Commit**

```bash
git add apps/frontend/components/public/HomeSection.vue
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(frontend): HomeSection alterné G/D auto"
```

### Task M7.5: ScheduleDisplay + ContactBlock + ContactForm

**Files:**
- Create: `apps/frontend/components/public/ScheduleDisplay.vue`
- Create: `apps/frontend/components/public/ContactBlock.vue`
- Create: `apps/frontend/components/public/ContactForm.vue`

- [ ] **Step 1: ScheduleDisplay**

```vue
<!-- components/public/ScheduleDisplay.vue -->
<template>
  <div class="space-y-1 text-sm">
    <div v-for="line in lines" :key="line.label">
      <span class="font-medium">{{ line.label }} :</span> {{ line.times }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface SW { id: string; label: string; daysOfWeek: number[]; startTime: string; endTime: string; isActive: boolean }
const props = defineProps<{ windows: SW[] }>();

const DAY_NAMES = ['', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const lines = computed(() => {
  return props.windows.map(w => {
    const days = w.daysOfWeek.map(d => DAY_NAMES[d]).join(' ');
    return { label: `${w.label} (${days})`, times: `${w.startTime} – ${w.endTime}` };
  });
});
</script>
```

- [ ] **Step 2: ContactForm**

```vue
<!-- components/public/ContactForm.vue -->
<template>
  <form @submit.prevent="submit" class="space-y-4">
    <div>
      <label class="block text-sm mb-1">Nom</label>
      <input v-model="form.name" required type="text" class="w-full px-3 py-2 border border-line bg-white" />
    </div>
    <div>
      <label class="block text-sm mb-1">Email</label>
      <input v-model="form.email" required type="email" class="w-full px-3 py-2 border border-line bg-white" />
    </div>
    <div>
      <label class="block text-sm mb-1">Message</label>
      <textarea v-model="form.message" required rows="4" class="w-full px-3 py-2 border border-line bg-white"></textarea>
    </div>
    <div v-if="captcha">
      <label class="block text-sm mb-1">Question : combien font {{ captcha.question }} ?</label>
      <input v-model="form.captchaAnswer" required type="text" class="w-32 px-3 py-2 border border-line bg-white" />
    </div>
    <button type="submit" :disabled="submitting" class="px-6 py-3 bg-ink text-bg hover:bg-accent transition disabled:opacity-50">
      {{ submitting ? 'Envoi…' : 'Envoyer' }}
    </button>
    <p v-if="success" class="text-green-700">Message envoyé, merci !</p>
    <p v-if="error" class="text-red-700">{{ error }}</p>
  </form>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const captcha = ref<{ question: string; token: string } | null>(null);
const form = reactive({ name: '', email: '', message: '', captchaAnswer: '' });
const submitting = ref(false);
const success = ref(false);
const error = ref('');

onMounted(async () => {
  const r = await $fetch<{ data: { question: string; token: string } }>(`${config.public.apiUrl}/contact-messages/captcha`);
  captcha.value = r.data;
});

async function submit() {
  if (!captcha.value) return;
  submitting.value = true; error.value = ''; success.value = false;
  try {
    await $fetch(`${config.public.apiUrl}/contact-messages`, {
      method: 'POST',
      body: { ...form, captchaToken: captcha.value.token },
    });
    success.value = true;
    Object.assign(form, { name: '', email: '', message: '', captchaAnswer: '' });
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Erreur d\'envoi';
  } finally {
    submitting.value = false;
  }
}
</script>
```

- [ ] **Step 3: ContactBlock**

```vue
<!-- components/public/ContactBlock.vue -->
<template>
  <section id="contact" class="py-20 px-6 bg-line/30">
    <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
      <div>
        <h2 class="font-display text-4xl mb-6">Nous trouver</h2>
        <h3 class="font-medium mt-6 mb-2">Horaires</h3>
        <ScheduleDisplay :windows="windows" />
        <h3 class="font-medium mt-6 mb-2">Adresse</h3>
        <p>{{ site.contact_address }}</p>
        <p class="mt-1"><a :href="`tel:${site.contact_phone}`" class="hover:text-accent">{{ site.contact_phone }}</a></p>
        <p><a :href="`mailto:${site.contact_email}`" class="hover:text-accent">{{ site.contact_email }}</a></p>
        <iframe v-if="site.google_maps_embed_url" :src="site.google_maps_embed_url" class="w-full h-64 mt-6 border border-line" loading="lazy"></iframe>
      </div>
      <div>
        <h2 class="font-display text-4xl mb-6">Nous écrire</h2>
        <ContactForm />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ site: Record<string, string>; windows: any[] }>();
</script>
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/components/public/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(frontend): ScheduleDisplay + ContactBlock + ContactForm"
```

### Task M7.6: `pages/index.vue` — accueil

**Files:**
- Modify (rewrite): `apps/frontend/pages/index.vue`

```vue
<!-- pages/index.vue -->
<template>
  <div>
    <Hero :title="site.hero_title" :subtitle="site.hero_subtitle" :image-id="site.hero_image_id || null" />
    <HomeSection v-for="(s, i) in sections" :key="s.id" :section="s" :index="i" />
    <ContactBlock :site="site" :windows="windows" />
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();

const [{ data: siteRes }, { data: sectionsRes }, { data: windowsRes }] = await Promise.all([
  useFetch<{ data: Record<string, string> }>(`${config.public.apiUrl}/public/site`),
  useFetch<{ data: any[] }>(`${config.public.apiUrl}/public/home-sections`),
  useFetch<{ data: any[] }>(`${config.public.apiUrl}/public/schedule`),
]);

const site = computed(() => siteRes.value?.data ?? {});
const sections = computed(() => sectionsRes.value?.data ?? []);
const windows = computed(() => windowsRes.value?.data ?? []);

useSeoMeta({
  title: site.value.seo_home_title || site.value.brand_name,
  description: site.value.seo_home_description,
});

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: site.value.brand_name,
      address: site.value.contact_address,
      telephone: site.value.contact_phone,
      email: site.value.contact_email,
    }),
  }],
});
</script>
```

- [ ] **Step 1: Commit**

```bash
git add apps/frontend/pages/index.vue
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(frontend): page accueil avec hero + sections + contact + JSON-LD Restaurant"
```

### Task M7.7: `pages/menu/index.vue`

**Files:**
- Create: `apps/frontend/pages/menu/index.vue`

```vue
<!-- pages/menu/index.vue -->
<template>
  <div class="max-w-4xl mx-auto px-6 py-16">
    <h1 class="font-display text-5xl text-center mb-12">Nos menus</h1>
    <div v-for="doc in documents" :key="doc.id" class="mb-16">
      <h2 class="font-display text-3xl mb-3">{{ doc.title }}</h2>
      <p v-if="doc.description" class="text-muted mb-6">{{ doc.description }}</p>
      <template v-if="doc.file.mimeType === 'application/pdf'">
        <embed :src="`${apiUrl}/images/${doc.file.id}`" type="application/pdf" class="w-full h-[800px] border border-line" />
        <a :href="`${apiUrl}/images/${doc.file.id}`" download class="inline-block mt-3 text-sm text-accent hover:underline">Télécharger le PDF</a>
      </template>
      <template v-else>
        <img :src="`${apiUrl}/images/${doc.file.id}`" :alt="doc.title" class="w-full" />
      </template>
    </div>
    <p v-if="!documents.length" class="text-center text-muted">Aucun menu publié pour le moment.</p>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const apiUrl = config.public.apiUrl;

const { data } = await useFetch<{ data: any[] }>(`${apiUrl}/public/menu-documents`);
const documents = computed(() => data.value?.data ?? []);

const { data: siteRes } = await useFetch<{ data: Record<string, string> }>(`${apiUrl}/public/site`);
const site = computed(() => siteRes.value?.data ?? {});

useSeoMeta({
  title: site.value.seo_menu_title || `Menu — ${site.value.brand_name}`,
  description: site.value.seo_menu_description,
});
</script>
```

- [ ] **Step 1: Commit**

```bash
git add apps/frontend/pages/menu/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(frontend): page /menu avec PDF embed + image"
```

### Task M7.8: Composable `useReservationFlow`

**Files:**
- Create: `apps/frontend/composables/useReservationFlow.ts`

```ts
// composables/useReservationFlow.ts
export interface Slot { time: string; serviceWindowId: string; serviceWindowLabel: string; date: string }

export function useReservationFlow() {
  const config = useRuntimeConfig();
  const apiUrl = config.public.apiUrl;

  const partySize = ref(2);
  const date = ref(new Date().toISOString().slice(0, 10));
  const slots = ref<Slot[]>([]);
  const selectedSlot = ref<Slot | null>(null);
  const loadingSlots = ref(false);
  const form = reactive({ clientName: '', clientEmail: '', clientPhone: '', notes: '' });
  const submitting = ref(false);
  const result = ref<null | { status: string; cancelToken: string }>(null);
  const error = ref('');

  async function fetchSlots() {
    loadingSlots.value = true;
    try {
      const r = await $fetch<{ data: Slot[] }>(`${apiUrl}/public/availability-slots`, {
        params: { date: date.value, partySize: partySize.value },
      });
      slots.value = r.data;
      selectedSlot.value = null;
    } finally {
      loadingSlots.value = false;
    }
  }

  const slotsByWindow = computed(() => {
    const groups: Record<string, { label: string; slots: Slot[] }> = {};
    for (const s of slots.value) {
      (groups[s.serviceWindowId] ??= { label: s.serviceWindowLabel, slots: [] }).slots.push(s);
    }
    return Object.values(groups);
  });

  async function submit() {
    if (!selectedSlot.value) return;
    submitting.value = true; error.value = '';
    const dateTime = `${date.value}T${selectedSlot.value.time}:00.000Z`;
    try {
      const r = await $fetch<{ data: { status: string; cancelToken: string } }>(`${apiUrl}/bookings`, {
        method: 'POST',
        body: {
          partySize: partySize.value, date: dateTime,
          clientName: form.clientName, clientEmail: form.clientEmail,
          clientPhone: form.clientPhone, notes: form.notes || undefined,
        },
      });
      result.value = r.data;
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Erreur lors de la création';
    } finally {
      submitting.value = false;
    }
  }

  watch([partySize, date], fetchSlots, { immediate: false });

  return { partySize, date, slots, slotsByWindow, selectedSlot, loadingSlots, fetchSlots, form, submit, submitting, result, error };
}
```

- [ ] **Step 1: Commit**

```bash
git add apps/frontend/composables/useReservationFlow.ts
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(frontend): useReservationFlow composable"
```

### Task M7.9: `pages/reservation/index.vue` — tunnel 1-page

**Files:**
- Modify (rewrite): `apps/frontend/pages/reservation/index.vue`

```vue
<!-- pages/reservation/index.vue -->
<template>
  <div class="max-w-2xl mx-auto px-6 py-16">
    <h1 class="font-display text-4xl text-center mb-10">Réserver une table</h1>

    <div v-if="!result" class="space-y-8">
      <!-- Couverts -->
      <div>
        <label class="block text-sm font-medium mb-2">Nombre de couverts</label>
        <div class="flex gap-2 flex-wrap">
          <button v-for="n in [1,2,3,4,5,6,7]" :key="n"
            type="button"
            @click="partySize = n"
            :class="['px-4 py-2 border', partySize === n ? 'bg-ink text-bg border-ink' : 'border-line']">
            {{ n }}
          </button>
          <input v-model.number="partySize" type="number" min="8" max="50" class="px-3 py-2 border border-line w-24" placeholder="8+" />
        </div>
      </div>

      <!-- Date -->
      <div>
        <label class="block text-sm font-medium mb-2">Date</label>
        <input v-model="date" type="date" :min="todayISO" class="px-3 py-2 border border-line" />
      </div>

      <!-- Slots -->
      <div>
        <label class="block text-sm font-medium mb-2">Créneau</label>
        <div v-if="loadingSlots" class="text-muted">Chargement…</div>
        <div v-else-if="!slotsByWindow.length" class="text-muted">Pas de créneaux disponibles à cette date.</div>
        <div v-else class="space-y-4">
          <div v-for="g in slotsByWindow" :key="g.label">
            <p class="text-xs text-muted uppercase tracking-wider mb-2">{{ g.label }}</p>
            <div class="flex flex-wrap gap-2">
              <button v-for="s in g.slots" :key="s.time"
                type="button"
                @click="selectedSlot = s"
                :class="['px-3 py-2 border', selectedSlot === s ? 'bg-ink text-bg border-ink' : 'border-line']">
                {{ s.time }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Coordonnées -->
      <div v-if="selectedSlot" class="space-y-4 pt-4 border-t border-line">
        <div>
          <label class="block text-sm font-medium mb-1">Nom</label>
          <input v-model="form.clientName" required type="text" class="w-full px-3 py-2 border border-line" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <input v-model="form.clientEmail" required type="email" class="w-full px-3 py-2 border border-line" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Téléphone</label>
          <input v-model="form.clientPhone" required type="tel" class="w-full px-3 py-2 border border-line" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Notes (allergies, occasion…)</label>
          <textarea v-model="form.notes" rows="3" class="w-full px-3 py-2 border border-line"></textarea>
        </div>
        <button @click="submit" :disabled="submitting" class="w-full px-6 py-3 bg-ink text-bg hover:bg-accent transition disabled:opacity-50">
          {{ submitting ? 'Envoi…' : 'Confirmer la réservation' }}
        </button>
        <p v-if="error" class="text-red-700">{{ error }}</p>
      </div>
    </div>

    <div v-else class="text-center py-8">
      <h2 class="font-display text-3xl mb-4">{{ result.status === 'CONFIRMED' ? 'Votre table est confirmée 🎉' : 'Demande reçue' }}</h2>
      <p class="text-muted">{{ result.status === 'CONFIRMED' ? 'Un email de confirmation vient de vous être envoyé.' : 'Nous validons votre demande sous 24h. Vous recevrez un email.' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false });

const flow = useReservationFlow();
const { partySize, date, slotsByWindow, selectedSlot, loadingSlots, fetchSlots, form, submit, submitting, result, error } = flow;
const todayISO = new Date().toISOString().slice(0, 10);

onMounted(fetchSlots);
</script>
```

- [ ] **Step 1: Commit**

```bash
git add apps/frontend/pages/reservation/index.vue
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(frontend): tunnel réservation 1-page"
```

### Task M7.10: `pages/reservation/[token]/cancel.vue` + `confirm.vue`

**Files:**
- Modify or Create: `apps/frontend/pages/reservation/[token]/cancel.vue`
- Modify or Create: `apps/frontend/pages/reservation/[token]/confirm.vue`

- [ ] **Step 1: cancel.vue**

```vue
<template>
  <div class="max-w-xl mx-auto px-6 py-16 text-center">
    <h1 class="font-display text-4xl mb-6">Annulation de votre réservation</h1>
    <p v-if="loading" class="text-muted">Annulation en cours…</p>
    <p v-else-if="error" class="text-red-700">{{ error }}</p>
    <p v-else class="text-green-700">Votre réservation a bien été annulée. Merci de nous avoir prévenu.</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false });
const route = useRoute();
const config = useRuntimeConfig();
const loading = ref(true); const error = ref('');
onMounted(async () => {
  try { await $fetch(`${config.public.apiUrl}/bookings/${route.params.token}/cancel`); }
  catch (e: any) { error.value = e?.data?.message ?? 'Lien invalide'; }
  finally { loading.value = false; }
});
</script>
```

- [ ] **Step 2: confirm.vue** (structure miroir, route différente)

```vue
<template>
  <div class="max-w-xl mx-auto px-6 py-16 text-center">
    <h1 class="font-display text-4xl mb-6">Confirmation de réservation</h1>
    <p v-if="loading" class="text-muted">Confirmation en cours…</p>
    <p v-else-if="error" class="text-red-700">{{ error }}</p>
    <p v-else class="text-green-700">Votre réservation est confirmée. À très bientôt !</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false });
const route = useRoute();
const config = useRuntimeConfig();
const loading = ref(true); const error = ref('');
onMounted(async () => {
  try { await $fetch(`${config.public.apiUrl}/bookings/${route.params.token}/confirm`); }
  catch (e: any) { error.value = e?.data?.message ?? 'Lien invalide'; }
  finally { loading.value = false; }
});
</script>
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/pages/reservation/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(frontend): pages cancel/confirm par token"
```

### Task M7.11: Smoke e2e public (manuel)

- [ ] **Step 1: Démarrer back + front**

```bash
COMPOSE_PROJECT_NAME=booking-resto docker compose up postgres mailhog -d
pnpm dev &
sleep 25
```

- [ ] **Step 2: Tester dans un navigateur**

Ouvrir :
- http://localhost:3100/ → hero + 2 sections + bloc contact ✓
- http://localhost:3100/menu → "Aucun menu publié" (normal, pas seedé) ✓
- http://localhost:3100/reservation → choisir 2 couverts + date + slot + form → confirmer → message succès ✓
- http://localhost:8025 → vérifier 2 emails (client confirmé + admin alerte) ✓

- [ ] **Step 3: Stopper**

```bash
kill %1
```

### Task M7.12: Milestone tag M7

```bash
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit --allow-empty -m "milestone(M7): frontend public complet (home + menu + reservation)"
```

---

## Milestone 8 — Frontend admin Nuxt 3 (18 tâches)

**Output testable :** L'admin peut se logger, voir le dashboard couverts, créer/valider/annuler des résa, gérer ServiceWindows + ScheduleExceptions + HomeSections + MenuDocuments + ContactMessages + Images + Settings via UI complète.

### Task M8.1: Layout admin + sidebar adaptée

**Files:**
- Modify: `apps/frontend/layouts/admin.vue`
- Modify: `apps/frontend/middleware/admin-auth.ts` (vérifier qu'il existe, sinon créer)

- [ ] **Step 1: Layout admin (sidebar resto)**

```vue
<!-- layouts/admin.vue -->
<template>
  <div class="min-h-screen bg-bg flex">
    <aside class="w-64 bg-white border-r border-line p-6 hidden md:block">
      <h1 class="font-display text-xl mb-8">Admin</h1>
      <nav class="space-y-1 text-sm">
        <NuxtLink to="/admin"               class="block px-3 py-2 rounded hover:bg-line">🏠 Dashboard</NuxtLink>
        <NuxtLink to="/admin/reservations"  class="block px-3 py-2 rounded hover:bg-line">📅 Réservations</NuxtLink>
        <NuxtLink to="/admin/horaires"      class="block px-3 py-2 rounded hover:bg-line">⏰ Horaires</NuxtLink>
        <hr class="my-3 border-line">
        <NuxtLink to="/admin/home"          class="block px-3 py-2 rounded hover:bg-line">🏡 Page d'accueil</NuxtLink>
        <NuxtLink to="/admin/menu"          class="block px-3 py-2 rounded hover:bg-line">🍽️ Menu</NuxtLink>
        <NuxtLink to="/admin/messages"      class="block px-3 py-2 rounded hover:bg-line">
          ✉️ Messages
          <span v-if="unread > 0" class="ml-2 px-2 py-0.5 text-xs bg-accent text-white rounded-full">{{ unread }}</span>
        </NuxtLink>
        <NuxtLink to="/admin/images"        class="block px-3 py-2 rounded hover:bg-line">🖼️ Images</NuxtLink>
        <NuxtLink to="/admin/parametres"    class="block px-3 py-2 rounded hover:bg-line">⚙️ Paramètres</NuxtLink>
        <hr class="my-3 border-line">
        <button @click="logout" class="block w-full text-left px-3 py-2 rounded hover:bg-line">🚪 Déconnexion</button>
      </nav>
    </aside>
    <main class="flex-1 p-6 md:p-10 overflow-x-auto">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { logout } = useAuth();
const unread = ref(0);
// TODO: poll unread every 60s — out of MVP scope, manual refresh
</script>
```

- [ ] **Step 2: Vérifier middleware `admin-auth.ts`** (héritage). S'il pointe vers une logique multi-tenant, la simplifier :

```ts
// middleware/admin-auth.ts
export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return;
  const token = localStorage.getItem('accessToken');
  if (!token) return navigateTo('/admin/login');
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/layouts/admin.vue apps/frontend/middleware/admin-auth.ts
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(admin): layout sidebar adaptée resto"
```

### Task M8.2: Dashboard `/admin/index.vue` — KPI couverts

**Files:**
- Modify (rewrite): `apps/frontend/pages/admin/index.vue`

```vue
<!-- pages/admin/index.vue -->
<template>
  <div>
    <h1 class="font-display text-3xl mb-8">Dashboard</h1>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard label="Couverts aujourd'hui"      :value="overview?.couvertsToday ?? 0" />
      <StatCard label="Réservations aujourd'hui"  :value="overview?.bookingsToday ?? 0" />
      <StatCard label="En attente de validation"  :value="overview?.pendingCount ?? 0" />
      <StatCard label="Taux midi / soir"          :value="`${overview?.tauxRemplissageMidi ?? 0}% / ${overview?.tauxRemplissageSoir ?? 0}%`" />
    </div>

    <WeekAgendaCard class="mb-8" />

    <div class="bg-white border border-line p-6">
      <h2 class="font-display text-xl mb-4">Couverts sur 7 jours</h2>
      <canvas ref="chartCanvas" class="max-h-64"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' });
import { Chart } from 'chart.js/auto';

const { apiFetch } = useAuth();
const overview = ref<any>(null);
const chartCanvas = ref<HTMLCanvasElement | null>(null);

onMounted(async () => {
  const r = await apiFetch<{ data: any }>('/admin/stats/overview');
  overview.value = r.data;
  if (chartCanvas.value && overview.value?.chart7d) {
    new Chart(chartCanvas.value, {
      type: 'line',
      data: {
        labels: overview.value.chart7d.map((d: any) => d.date.slice(5)),
        datasets: [{ label: 'Couverts', data: overview.value.chart7d.map((d: any) => d.couverts), borderColor: '#8B6F47', tension: 0.3 }],
      },
      options: { responsive: true, plugins: { legend: { display: false } } },
    });
  }
});
</script>
```

- [ ] **Step 1: Commit**

```bash
git add apps/frontend/pages/admin/index.vue
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(admin): dashboard couverts + chart 7j"
```

### Task M8.3: Adapter `WeekAgendaCard.vue` pour afficher couverts

**Files:**
- Modify: `apps/frontend/components/admin/WeekAgendaCard.vue`

- [ ] **Step 1: Réécrire pour utiliser `/admin/bookings/agenda`**

```vue
<!-- components/admin/WeekAgendaCard.vue -->
<template>
  <div class="bg-white border border-line p-6">
    <h2 class="font-display text-xl mb-4">Semaine à venir</h2>
    <div v-if="loading" class="text-muted">Chargement…</div>
    <div v-else-if="!Object.keys(agenda).length" class="text-muted">Aucune réservation dans la semaine.</div>
    <div v-else class="space-y-4">
      <div v-for="(items, day) in agenda" :key="day" class="border-l-2 border-accent pl-4">
        <p class="text-sm font-medium mb-1">{{ formatDay(day) }} ({{ totalCovers(items) }} couverts)</p>
        <ul class="text-sm space-y-1 text-muted">
          <li v-for="b in items" :key="b.id">
            {{ formatTime(b.date) }} — {{ b.partySize }} couv. — {{ b.clientName }}
            <span v-if="b.status === 'PENDING'" class="ml-2 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">PENDING</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { apiFetch } = useAuth();
const agenda = ref<Record<string, any[]>>({});
const loading = ref(true);

onMounted(async () => {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDays = new Date(); sevenDays.setDate(sevenDays.getDate() + 7);
  const to = sevenDays.toISOString().slice(0, 10);
  const r = await apiFetch<{ data: Record<string, any[]> }>(`/admin/bookings/agenda?from=${today}&to=${to}`);
  agenda.value = r.data;
  loading.value = false;
});

function formatDay(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function totalCovers(items: any[]) {
  return items.reduce((s, b) => s + b.partySize, 0);
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/components/admin/WeekAgendaCard.vue
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(admin): WeekAgendaCard adaptée couverts"
```

### Task M8.4: `/admin/reservations/index.vue`

**Files:**
- Modify (rewrite): `apps/frontend/pages/admin/reservations/index.vue`

```vue
<!-- pages/admin/reservations/index.vue -->
<template>
  <div>
    <h1 class="font-display text-3xl mb-6">Réservations</h1>

    <WeekAgendaCard class="mb-8" />

    <div class="bg-white border border-line">
      <div class="p-4 border-b border-line flex gap-4 flex-wrap">
        <input v-model="search" @input="debouncedFetch" placeholder="Recherche nom/email/tél" class="px-3 py-2 border border-line text-sm" />
        <select v-model="status" @change="fetch" class="px-3 py-2 border border-line text-sm">
          <option value="">Tous statuts</option>
          <option value="PENDING">En attente</option>
          <option value="CONFIRMED">Confirmé</option>
          <option value="CANCELLED">Annulé</option>
          <option value="COMPLETED">Terminé</option>
          <option value="NO_SHOW">No-show</option>
        </select>
      </div>
      <table class="w-full text-sm">
        <thead class="bg-line/30 text-left">
          <tr>
            <th class="p-3">Date</th><th class="p-3">Service</th><th class="p-3">Couverts</th><th class="p-3">Client</th><th class="p-3">Tél</th><th class="p-3">Statut</th><th class="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in items" :key="b.id" class="border-t border-line">
            <td class="p-3">{{ formatDateTime(b.date) }}</td>
            <td class="p-3">{{ b.serviceWindow?.label ?? '—' }}</td>
            <td class="p-3">{{ b.partySize }}</td>
            <td class="p-3">{{ b.clientName }}<br><span class="text-xs text-muted">{{ b.clientEmail }}</span></td>
            <td class="p-3">{{ b.clientPhone }}</td>
            <td class="p-3"><span :class="badgeClass(b.status)" class="px-2 py-0.5 rounded text-xs">{{ b.status }}</span></td>
            <td class="p-3 space-x-2">
              <button v-if="b.status === 'PENDING'" @click="patch(b.id, 'CONFIRMED')" class="text-xs text-green-700 hover:underline">Confirmer</button>
              <button v-if="b.status !== 'CANCELLED'" @click="patch(b.id, 'CANCELLED')" class="text-xs text-red-700 hover:underline">Annuler</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!items.length" class="p-6 text-center text-muted">Aucune réservation</p>
      <div class="p-4 border-t border-line flex justify-between text-sm">
        <span>{{ total }} résultats</span>
        <div class="space-x-2">
          <button :disabled="page <= 1" @click="page--; fetch()" class="px-2 py-1 border border-line disabled:opacity-50">‹</button>
          <button :disabled="page * pageSize >= total" @click="page++; fetch()" class="px-2 py-1 border border-line disabled:opacity-50">›</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' });
const { apiFetch } = useAuth();
const { showToast } = useToast();

const items = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const search = ref('');
const status = ref('');

let debounceTimer: any;
function debouncedFetch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetch, 300);
}

async function fetch() {
  const params = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize) });
  if (status.value) params.set('status', status.value);
  if (search.value) params.set('search', search.value);
  const r = await apiFetch<{ data: { items: any[]; total: number } }>(`/admin/bookings?${params}`);
  items.value = r.data.items;
  total.value = r.data.total;
}

async function patch(id: string, newStatus: string) {
  if (!confirm(`Passer cette réservation en ${newStatus} ?`)) return;
  await apiFetch(`/admin/bookings/${id}`, { method: 'PATCH', body: { status: newStatus } });
  showToast(`Réservation ${newStatus.toLowerCase()}`);
  await fetch();
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}
function badgeClass(s: string) {
  return ({
    PENDING:   'bg-amber-100 text-amber-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    NO_SHOW:   'bg-gray-200 text-gray-700',
  } as any)[s] ?? 'bg-gray-100';
}

onMounted(fetch);
</script>
```

- [ ] **Step 1: Commit**

```bash
git add apps/frontend/pages/admin/reservations/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(admin): page réservations (liste + filtres + actions)"
```

### Task M8.5: ServiceWindowForm composant + modal

**Files:**
- Create: `apps/frontend/components/admin/ServiceWindowForm.vue`

```vue
<!-- components/admin/ServiceWindowForm.vue -->
<template>
  <form @submit.prevent="submit" class="space-y-4">
    <div>
      <label class="block text-sm mb-1">Libellé</label>
      <input v-model="form.label" required class="w-full px-3 py-2 border border-line" />
    </div>
    <div>
      <label class="block text-sm mb-1">Jours</label>
      <div class="flex gap-2">
        <button v-for="(name, i) in DAYS" :key="i" type="button"
          @click="toggleDay(i + 1)"
          :class="['w-12 py-2 border text-sm', form.daysOfWeek.includes(i + 1) ? 'bg-ink text-bg border-ink' : 'border-line']">
          {{ name }}
        </button>
      </div>
    </div>
    <div class="flex gap-3">
      <div class="flex-1">
        <label class="block text-sm mb-1">Début (HH:mm)</label>
        <input v-model="form.startTime" required pattern="[0-2][0-9]:[0-5][0-9]" placeholder="12:00" class="w-full px-3 py-2 border border-line" />
      </div>
      <div class="flex-1">
        <label class="block text-sm mb-1">Fin (HH:mm)</label>
        <input v-model="form.endTime" required pattern="[0-2][0-9]:[0-5][0-9]" placeholder="14:00" class="w-full px-3 py-2 border border-line" />
      </div>
    </div>
    <label class="flex items-center gap-2 text-sm">
      <input v-model="form.isActive" type="checkbox" /> Active
    </label>
    <div class="flex gap-2 justify-end">
      <button type="button" @click="$emit('cancel')" class="px-4 py-2 border border-line">Annuler</button>
      <button type="submit" :disabled="submitting" class="px-4 py-2 bg-ink text-bg disabled:opacity-50">Enregistrer</button>
    </div>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{ initial?: any }>();
const emit = defineEmits<{ submit: [payload: any]; cancel: [] }>();

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const form = reactive({
  label: props.initial?.label ?? '',
  daysOfWeek: props.initial?.daysOfWeek ?? [] as number[],
  startTime: props.initial?.startTime ?? '12:00',
  endTime: props.initial?.endTime ?? '14:00',
  isActive: props.initial?.isActive ?? true,
});
const submitting = ref(false);

function toggleDay(d: number) {
  const i = form.daysOfWeek.indexOf(d);
  if (i >= 0) form.daysOfWeek.splice(i, 1);
  else form.daysOfWeek.push(d);
}

async function submit() {
  if (!form.daysOfWeek.length) { alert('Sélectionner au moins un jour'); return; }
  submitting.value = true;
  emit('submit', { ...form });
  submitting.value = false;
}
</script>
```

- [ ] **Step 1: Commit**

```bash
git add apps/frontend/components/admin/ServiceWindowForm.vue
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(admin): ServiceWindowForm composant"
```

### Task M8.6: `/admin/horaires/index.vue` — page combinée

**Files:**
- Create: `apps/frontend/pages/admin/horaires/index.vue`

```vue
<!-- pages/admin/horaires/index.vue -->
<template>
  <div class="space-y-12">
    <h1 class="font-display text-3xl">Horaires & Fermetures</h1>

    <!-- Service Windows -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-display text-2xl">Plages de service</h2>
        <button @click="openWindowModal()" class="px-4 py-2 bg-ink text-bg">+ Ajouter</button>
      </div>
      <div class="space-y-2">
        <div v-for="w in windows" :key="w.id" class="bg-white border border-line p-4 flex items-center justify-between">
          <div>
            <p class="font-medium">{{ w.label }} <span v-if="!w.isActive" class="text-xs text-muted">(inactive)</span></p>
            <p class="text-sm text-muted">{{ formatDays(w.daysOfWeek) }} · {{ w.startTime }} → {{ w.endTime }}</p>
          </div>
          <div class="space-x-2">
            <button @click="openWindowModal(w)" class="text-sm hover:text-accent">Modifier</button>
            <button @click="deleteWindow(w.id)" class="text-sm text-red-700 hover:underline">Supprimer</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Exceptions -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-display text-2xl">Fermetures exceptionnelles</h2>
        <button @click="openExceptionModal()" class="px-4 py-2 bg-ink text-bg">+ Ajouter</button>
      </div>
      <table class="w-full bg-white border border-line text-sm">
        <thead class="bg-line/30 text-left">
          <tr><th class="p-3">Du</th><th class="p-3">Au</th><th class="p-3">Raison</th><th class="p-3"></th></tr>
        </thead>
        <tbody>
          <tr v-for="e in exceptions" :key="e.id" class="border-t border-line">
            <td class="p-3">{{ formatDate(e.startDate) }}</td>
            <td class="p-3">{{ formatDate(e.endDate) }}</td>
            <td class="p-3">{{ e.reason || '—' }}</td>
            <td class="p-3 text-right"><button @click="deleteException(e.id)" class="text-red-700 text-sm hover:underline">Supprimer</button></td>
          </tr>
        </tbody>
      </table>
      <p v-if="!exceptions.length" class="p-4 text-center text-muted bg-white border border-line border-t-0">Aucune fermeture</p>
    </section>

    <!-- Modal Window -->
    <Teleport to="body">
      <div v-if="windowModal.open" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
        <div class="bg-white p-6 max-w-md w-full">
          <h3 class="font-display text-xl mb-4">{{ windowModal.editing ? 'Modifier' : 'Ajouter' }} une plage</h3>
          <ServiceWindowForm :initial="windowModal.editing" @submit="submitWindow" @cancel="windowModal.open = false" />
        </div>
      </div>
    </Teleport>

    <!-- Modal Exception -->
    <Teleport to="body">
      <div v-if="exceptionModal.open" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
        <div class="bg-white p-6 max-w-md w-full">
          <h3 class="font-display text-xl mb-4">Ajouter une fermeture</h3>
          <form @submit.prevent="submitException" class="space-y-4">
            <div><label class="block text-sm mb-1">Date début</label>
              <input v-model="exceptionForm.startDate" required type="date" class="w-full px-3 py-2 border border-line" /></div>
            <div><label class="block text-sm mb-1">Date fin</label>
              <input v-model="exceptionForm.endDate" required type="date" class="w-full px-3 py-2 border border-line" /></div>
            <div><label class="block text-sm mb-1">Raison (optionnel)</label>
              <input v-model="exceptionForm.reason" class="w-full px-3 py-2 border border-line" /></div>
            <div class="flex gap-2 justify-end">
              <button type="button" @click="exceptionModal.open = false" class="px-4 py-2 border border-line">Annuler</button>
              <button type="submit" class="px-4 py-2 bg-ink text-bg">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' });
const { apiFetch } = useAuth();
const { showToast } = useToast();

const windows = ref<any[]>([]);
const exceptions = ref<any[]>([]);

const windowModal = reactive({ open: false, editing: null as any });
const exceptionModal = reactive({ open: false });
const exceptionForm = reactive({ startDate: '', endDate: '', reason: '' });

const DAY_NAMES = ['', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

onMounted(fetchAll);
async function fetchAll() {
  const [w, e] = await Promise.all([
    apiFetch<{ data: any[] }>('/service-windows'),
    apiFetch<{ data: any[] }>('/schedule-exceptions'),
  ]);
  windows.value = w.data;
  exceptions.value = e.data;
}

function openWindowModal(w?: any) {
  windowModal.editing = w ?? null;
  windowModal.open = true;
}

async function submitWindow(payload: any) {
  if (windowModal.editing) {
    await apiFetch(`/service-windows/${windowModal.editing.id}`, { method: 'PATCH', body: payload });
  } else {
    await apiFetch('/service-windows', { method: 'POST', body: payload });
  }
  windowModal.open = false;
  showToast('Plage enregistrée');
  await fetchAll();
}

async function deleteWindow(id: string) {
  if (!confirm('Supprimer cette plage ?')) return;
  await apiFetch(`/service-windows/${id}`, { method: 'DELETE' });
  await fetchAll();
}

function openExceptionModal() {
  Object.assign(exceptionForm, { startDate: '', endDate: '', reason: '' });
  exceptionModal.open = true;
}

async function submitException() {
  await apiFetch('/schedule-exceptions', { method: 'POST', body: exceptionForm });
  exceptionModal.open = false;
  showToast('Fermeture ajoutée');
  await fetchAll();
}

async function deleteException(id: string) {
  if (!confirm('Supprimer ?')) return;
  await apiFetch(`/schedule-exceptions/${id}`, { method: 'DELETE' });
  await fetchAll();
}

function formatDays(d: number[]) { return d.map(i => DAY_NAMES[i]).join(' '); }
function formatDate(iso: string) { return new Date(iso).toLocaleDateString('fr-FR'); }
</script>
```

- [ ] **Step 1: Commit**

```bash
git add apps/frontend/pages/admin/horaires/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(admin): page horaires combinée (windows + exceptions)"
```

### Task M8.7: `useImageUpload` étendu pour PDF

**Files:**
- Modify: `apps/frontend/composables/useImageUpload.ts`

- [ ] **Step 1: Adapter pour gérer PDF (skip resize)**

```ts
// composables/useImageUpload.ts
export function useImageUpload() {
  const { apiFetch } = useAuth();

  const MAX_SIZE = 5 * 1024 * 1024;
  const MAX_DIMENSION = 2000;
  const QUALITY = 0.85;

  async function resizeImage(file: File): Promise<{ blob: Blob; width: number; height: number; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => {
          if (!blob) return reject(new Error('Conversion image échouée'));
          resolve({ blob, width, height, mimeType: 'image/jpeg' });
        }, 'image/jpeg', QUALITY);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  async function upload(file: File, section: string, caption?: string) {
    if (file.size > MAX_SIZE) throw new Error('Fichier trop volumineux (max 5 Mo)');

    const isPdf = file.type === 'application/pdf';
    let blob: Blob; let width: number | undefined; let height: number | undefined; let mimeType: string;

    if (isPdf) {
      blob = file;
      mimeType = 'application/pdf';
    } else {
      const r = await resizeImage(file);
      blob = r.blob; width = r.width; height = r.height; mimeType = r.mimeType;
    }

    const fd = new FormData();
    fd.append('file', blob, file.name);
    fd.append('section', section);
    if (caption) fd.append('caption', caption);
    if (width)  fd.append('width', String(width));
    if (height) fd.append('height', String(height));

    return apiFetch<{ data: { id: string } }>('/admin/images', { method: 'POST', body: fd });
  }

  return { upload };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/composables/useImageUpload.ts
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(admin): useImageUpload accepte PDF (skip resize)"
```

### Task M8.8: `/admin/home/index.vue` — éditeur HomeSections

**Files:**
- Create: `apps/frontend/pages/admin/home/index.vue`
- Create: `apps/frontend/components/admin/HomeSectionForm.vue`

- [ ] **Step 1: HomeSectionForm composant**

```vue
<!-- components/admin/HomeSectionForm.vue -->
<template>
  <form @submit.prevent="submit" class="space-y-4">
    <div><label class="block text-sm mb-1">Titre</label>
      <input v-model="form.title" required class="w-full px-3 py-2 border border-line" /></div>
    <div><label class="block text-sm mb-1">Texte</label>
      <textarea v-model="form.body" required rows="6" class="w-full px-3 py-2 border border-line"></textarea></div>
    <div>
      <label class="block text-sm mb-1">Image</label>
      <div v-if="form.imageId" class="mb-2">
        <img :src="`${apiUrl}/images/${form.imageId}`" class="h-24 object-cover" />
        <button type="button" @click="form.imageId = ''" class="text-sm text-red-700 hover:underline">Retirer</button>
      </div>
      <input type="file" accept="image/*" @change="onFile" />
      <p v-if="uploading" class="text-sm text-muted mt-1">Upload…</p>
    </div>
    <label class="flex items-center gap-2 text-sm">
      <input v-model="form.isPublished" type="checkbox" /> Publié
    </label>
    <div class="flex gap-2 justify-end">
      <button type="button" @click="$emit('cancel')" class="px-4 py-2 border border-line">Annuler</button>
      <button type="submit" :disabled="uploading" class="px-4 py-2 bg-ink text-bg disabled:opacity-50">Enregistrer</button>
    </div>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{ initial?: any }>();
const emit = defineEmits<{ submit: [payload: any]; cancel: [] }>();

const config = useRuntimeConfig();
const apiUrl = config.public.apiUrl;
const { upload } = useImageUpload();

const form = reactive({
  title: props.initial?.title ?? '',
  body: props.initial?.body ?? '',
  imageId: props.initial?.imageId ?? props.initial?.image?.id ?? '',
  isPublished: props.initial?.isPublished ?? true,
});
const uploading = ref(false);

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    const r = await upload(file, 'HOMESECTION');
    form.imageId = r.data.id;
  } catch (err: any) {
    alert(err.message);
  } finally {
    uploading.value = false;
  }
}

function submit() { emit('submit', { ...form }); }
</script>
```

- [ ] **Step 2: Page admin/home/index.vue**

```vue
<!-- pages/admin/home/index.vue -->
<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-display text-3xl">Page d'accueil</h1>
      <button @click="openModal()" class="px-4 py-2 bg-ink text-bg">+ Ajouter une section</button>
    </div>

    <ul class="space-y-3">
      <li v-for="(s, i) in sections" :key="s.id" class="bg-white border border-line p-4 flex items-center gap-4">
        <span class="text-muted text-sm w-8">#{{ i + 1 }}</span>
        <img v-if="s.image" :src="`${apiUrl}/images/${s.image.id}`" class="h-16 w-16 object-cover" />
        <div class="flex-1">
          <p class="font-medium">{{ s.title }} <span v-if="!s.isPublished" class="text-xs text-muted">(brouillon)</span></p>
          <p class="text-sm text-muted line-clamp-1">{{ s.body }}</p>
          <p class="text-xs text-muted mt-1">{{ i % 2 === 0 ? '↰ Image gauche' : '↱ Image droite' }}</p>
        </div>
        <div class="space-x-2">
          <button @click="openModal(s)" class="text-sm hover:text-accent">Modifier</button>
          <button @click="del(s.id)" class="text-sm text-red-700 hover:underline">Supprimer</button>
          <button v-if="i > 0" @click="move(i, -1)" class="text-sm">↑</button>
          <button v-if="i < sections.length - 1" @click="move(i, 1)" class="text-sm">↓</button>
        </div>
      </li>
    </ul>

    <Teleport to="body">
      <div v-if="modal.open" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
        <div class="bg-white p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h3 class="font-display text-xl mb-4">{{ modal.editing ? 'Modifier' : 'Ajouter' }} une section</h3>
          <HomeSectionForm :initial="modal.editing" @submit="submit" @cancel="modal.open = false" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' });
const { apiFetch } = useAuth();
const { showToast } = useToast();
const config = useRuntimeConfig();
const apiUrl = config.public.apiUrl;

const sections = ref<any[]>([]);
const modal = reactive({ open: false, editing: null as any });

onMounted(fetch);
async function fetch() {
  const r = await apiFetch<{ data: any[] }>('/admin/home-sections');
  sections.value = r.data;
}

function openModal(s?: any) {
  modal.editing = s ?? null;
  modal.open = true;
}

async function submit(payload: any) {
  if (modal.editing) {
    await apiFetch(`/admin/home-sections/${modal.editing.id}`, { method: 'PATCH', body: payload });
  } else {
    await apiFetch('/admin/home-sections', { method: 'POST', body: payload });
  }
  modal.open = false;
  showToast('Section enregistrée');
  await fetch();
}

async function del(id: string) {
  if (!confirm('Supprimer ?')) return;
  await apiFetch(`/admin/home-sections/${id}`, { method: 'DELETE' });
  await fetch();
}

async function move(idx: number, delta: number) {
  const arr = [...sections.value];
  const [item] = arr.splice(idx, 1);
  arr.splice(idx + delta, 0, item);
  await apiFetch('/admin/home-sections/reorder', { method: 'PATCH', body: { ids: arr.map(s => s.id) } });
  sections.value = arr;
}
</script>
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/pages/admin/home/ apps/frontend/components/admin/HomeSectionForm.vue
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(admin): page home + HomeSectionForm + reorder"
```

### Task M8.9: `/admin/menu/index.vue` — éditeur MenuDocuments

**Files:**
- Create: `apps/frontend/pages/admin/menu/index.vue`
- Create: `apps/frontend/components/admin/MenuDocumentForm.vue`

(Structure jumelle de M8.8 avec adaptation : upload accept `image/*,application/pdf`, preview avec icône PDF si non-image.)

- [ ] **Step 1: MenuDocumentForm**

```vue
<!-- components/admin/MenuDocumentForm.vue -->
<template>
  <form @submit.prevent="submit" class="space-y-4">
    <div><label class="block text-sm mb-1">Titre</label>
      <input v-model="form.title" required class="w-full px-3 py-2 border border-line" /></div>
    <div><label class="block text-sm mb-1">Description (optionnelle)</label>
      <textarea v-model="form.description" rows="3" class="w-full px-3 py-2 border border-line"></textarea></div>
    <div>
      <label class="block text-sm mb-1">Fichier (image ou PDF, max 5 Mo)</label>
      <div v-if="form.fileId" class="mb-2">
        <p class="text-sm">Fichier uploadé ✓ <button type="button" @click="form.fileId = ''" class="text-red-700 hover:underline">Changer</button></p>
      </div>
      <input v-else type="file" accept="image/*,application/pdf" required @change="onFile" />
      <p v-if="uploading" class="text-sm text-muted mt-1">Upload…</p>
    </div>
    <label class="flex items-center gap-2 text-sm">
      <input v-model="form.isPublished" type="checkbox" /> Publié
    </label>
    <div class="flex gap-2 justify-end">
      <button type="button" @click="$emit('cancel')" class="px-4 py-2 border border-line">Annuler</button>
      <button type="submit" :disabled="uploading || !form.fileId" class="px-4 py-2 bg-ink text-bg disabled:opacity-50">Enregistrer</button>
    </div>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{ initial?: any }>();
const emit = defineEmits<{ submit: [payload: any]; cancel: [] }>();
const { upload } = useImageUpload();

const form = reactive({
  title: props.initial?.title ?? '',
  description: props.initial?.description ?? '',
  fileId: props.initial?.fileId ?? props.initial?.file?.id ?? '',
  isPublished: props.initial?.isPublished ?? true,
});
const uploading = ref(false);

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    const r = await upload(file, 'MENU');
    form.fileId = r.data.id;
  } catch (err: any) { alert(err.message); }
  finally { uploading.value = false; }
}

function submit() { emit('submit', { ...form }); }
</script>
```

- [ ] **Step 2: Page** (clone exact de `/admin/home/index.vue` avec `home-sections` → `menu-documents`, `image` → `file`, et utilisation de `MenuDocumentForm`)

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/pages/admin/menu/ apps/frontend/components/admin/MenuDocumentForm.vue
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(admin): page menu + MenuDocumentForm"
```

### Task M8.10: `/admin/messages/index.vue`

**Files:**
- Create: `apps/frontend/pages/admin/messages/index.vue`

```vue
<!-- pages/admin/messages/index.vue -->
<template>
  <div>
    <h1 class="font-display text-3xl mb-6">Messages</h1>
    <div class="bg-white border border-line">
      <ul>
        <li v-for="m in items" :key="m.id"
          @click="open(m)"
          :class="['p-4 border-b border-line cursor-pointer hover:bg-line/30', m.isRead ? '' : 'font-semibold']">
          <div class="flex justify-between text-sm">
            <span>{{ m.name }} &lt;{{ m.email }}&gt;</span>
            <span class="text-muted">{{ formatDate(m.createdAt) }}</span>
          </div>
          <p class="text-sm text-muted line-clamp-1 mt-1">{{ m.message }}</p>
        </li>
      </ul>
      <p v-if="!items.length" class="p-6 text-center text-muted">Aucun message</p>
    </div>

    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-end" @click.self="selected = null">
        <div class="bg-white w-full max-w-md h-full p-6 overflow-y-auto">
          <h3 class="font-display text-xl mb-2">{{ selected.name }}</h3>
          <p class="text-sm text-muted mb-4"><a :href="`mailto:${selected.email}`" class="hover:text-accent">{{ selected.email }}</a></p>
          <p class="text-xs text-muted mb-4">{{ formatDate(selected.createdAt) }}</p>
          <p class="whitespace-pre-line">{{ selected.message }}</p>
          <div class="mt-6 flex gap-2">
            <button @click="toggleRead" class="px-3 py-2 border border-line text-sm">{{ selected.isRead ? 'Marquer non lu' : 'Marquer lu' }}</button>
            <button @click="del" class="px-3 py-2 border border-red-700 text-red-700 text-sm hover:bg-red-700 hover:text-white">Supprimer</button>
            <button @click="selected = null" class="ml-auto px-3 py-2 border border-line text-sm">Fermer</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' });
const { apiFetch } = useAuth();
const items = ref<any[]>([]);
const selected = ref<any>(null);

onMounted(fetch);
async function fetch() {
  const r = await apiFetch<{ data: { items: any[] } }>('/admin/contact-messages?page=1&pageSize=50');
  items.value = r.data.items;
}

async function open(m: any) {
  selected.value = m;
  if (!m.isRead) {
    await apiFetch(`/admin/contact-messages/${m.id}`, { method: 'PATCH', body: { isRead: true } });
    m.isRead = true;
  }
}

async function toggleRead() {
  selected.value.isRead = !selected.value.isRead;
  await apiFetch(`/admin/contact-messages/${selected.value.id}`, { method: 'PATCH', body: { isRead: selected.value.isRead } });
}

async function del() {
  if (!confirm('Supprimer ce message ?')) return;
  await apiFetch(`/admin/contact-messages/${selected.value.id}`, { method: 'DELETE' });
  selected.value = null;
  await fetch();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR');
}
</script>
```

- [ ] **Step 1: Commit**

```bash
git add apps/frontend/pages/admin/messages/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(admin): page messages avec drawer"
```

### Task M8.11: `/admin/images/index.vue` adaptée (filter par section)

**Files:**
- Modify (rewrite): `apps/frontend/pages/admin/images/index.vue`

```vue
<!-- pages/admin/images/index.vue -->
<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-display text-3xl">Images & Fichiers</h1>
      <div class="flex gap-2">
        <select v-model="filter" @change="fetch" class="px-3 py-2 border border-line text-sm">
          <option value="HERO">Hero</option>
          <option value="HOMESECTION">Sections home</option>
          <option value="MENU">Menu</option>
          <option value="OTHER">Autre</option>
        </select>
        <label class="px-4 py-2 bg-ink text-bg cursor-pointer">
          + Upload
          <input type="file" accept="image/*,application/pdf" @change="onUpload" class="hidden" />
        </label>
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="img in items" :key="img.id" class="bg-white border border-line p-3">
        <div class="aspect-square flex items-center justify-center bg-line/30 mb-2">
          <template v-if="img.mimeType === 'application/pdf'">
            <span class="text-4xl">📄</span>
          </template>
          <template v-else>
            <img :src="`${apiUrl}/images/${img.id}`" class="w-full h-full object-cover" />
          </template>
        </div>
        <p class="text-xs text-muted truncate">{{ img.mimeType }} · {{ formatSize(img.size) }}</p>
        <button @click="del(img.id)" class="mt-1 text-xs text-red-700 hover:underline">Supprimer</button>
      </div>
    </div>
    <p v-if="!items.length" class="text-center text-muted py-12">Aucun fichier dans cette section</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' });
const { apiFetch } = useAuth();
const { upload } = useImageUpload();
const config = useRuntimeConfig();
const apiUrl = config.public.apiUrl;

const filter = ref('HOMESECTION');
const items = ref<any[]>([]);

onMounted(fetch);
async function fetch() {
  const r = await apiFetch<{ data: any[] }>(`/admin/images?section=${filter.value}`);
  items.value = r.data;
}

async function onUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try { await upload(file, filter.value); await fetch(); }
  catch (err: any) { alert(err.message); }
}

async function del(id: string) {
  if (!confirm('Supprimer ?')) return;
  try { await apiFetch(`/admin/images/${id}`, { method: 'DELETE' }); await fetch(); }
  catch (e: any) { alert(e?.data?.message ?? 'Erreur'); }
}

function formatSize(b: number) { return `${(b / 1024).toFixed(1)} Ko`; }
</script>
```

- [ ] **Step 1: Commit**

```bash
git add apps/frontend/pages/admin/images/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(admin): page images filtrée par section + accept PDF"
```

### Task M8.12: `useSettings` composable + `/admin/parametres/index.vue`

**Files:**
- Create: `apps/frontend/composables/useSettings.ts`
- Create: `apps/frontend/pages/admin/parametres/index.vue`

- [ ] **Step 1: useSettings**

```ts
// composables/useSettings.ts
export function useSettings() {
  const { apiFetch } = useAuth();
  const settings = ref<Record<string, string>>({});

  async function load() {
    const r = await apiFetch<{ data: Record<string, string> }>('/admin/settings');
    settings.value = r.data;
  }

  async function save(payload: Partial<Record<string, string>>) {
    const r = await apiFetch<{ data: Record<string, string> }>('/admin/settings', { method: 'PUT', body: payload });
    settings.value = r.data;
  }

  return { settings, load, save };
}
```

- [ ] **Step 2: Page**

```vue
<!-- pages/admin/parametres/index.vue -->
<template>
  <div>
    <h1 class="font-display text-3xl mb-6">Paramètres</h1>

    <div v-if="loaded" class="space-y-8 max-w-2xl">
      <section class="bg-white border border-line p-6 space-y-4">
        <h2 class="font-display text-xl mb-2">Réservations</h2>
        <Field label="Capacité max simultanée (couverts)"   v-model="local.capacity_max" type="number" />
        <Field label="Durée moyenne d'un repas (min)"       v-model="local.default_meal_duration_min" type="number" />
        <Field label="Seuil auto-confirm (couverts)"        v-model="local.auto_confirm_threshold" type="number" />
        <Field label="Réservation au plus tôt (jours)"      v-model="local.lookahead_days" type="number" />
        <Field label="Délai minimum avant créneau (heures)" v-model="local.cutoff_hours" type="number" />
        <Field label="Intervalle entre créneaux (min)"      v-model="local.slot_interval_min" type="number" />
      </section>

      <section class="bg-white border border-line p-6 space-y-4">
        <h2 class="font-display text-xl mb-2">Page d'accueil</h2>
        <Field label="Titre du hero"        v-model="local.hero_title" />
        <Field label="Sous-titre du hero"   v-model="local.hero_subtitle" />
        <Field label="ID de l'image hero"   v-model="local.hero_image_id" hint="(uploader d'abord dans /admin/images section HERO)" />
      </section>

      <section class="bg-white border border-line p-6 space-y-4">
        <h2 class="font-display text-xl mb-2">Contact</h2>
        <Field label="Nom de l'établissement" v-model="local.brand_name" />
        <Field label="Adresse"                v-model="local.contact_address" />
        <Field label="Téléphone"              v-model="local.contact_phone" />
        <Field label="Email"                  v-model="local.contact_email" type="email" />
        <Field label="Lien Google Maps (src embed)" v-model="local.google_maps_embed_url" />
        <Field label="Instagram URL"          v-model="local.instagram_url" />
      </section>

      <section class="bg-white border border-line p-6 space-y-4">
        <h2 class="font-display text-xl mb-2">SEO</h2>
        <Field label="Titre meta accueil"        v-model="local.seo_home_title" />
        <Field label="Description meta accueil"  v-model="local.seo_home_description" />
        <Field label="Titre meta menu"           v-model="local.seo_menu_title" />
        <Field label="Description meta menu"     v-model="local.seo_menu_description" />
      </section>

      <button @click="onSave" :disabled="saving" class="px-6 py-3 bg-ink text-bg hover:bg-accent disabled:opacity-50">
        {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' });
const { settings, load, save } = useSettings();
const { showToast } = useToast();
const local = reactive<Record<string, string>>({});
const loaded = ref(false);
const saving = ref(false);

onMounted(async () => {
  await load();
  Object.assign(local, settings.value);
  loaded.value = true;
});

async function onSave() {
  saving.value = true;
  try {
    await save(local);
    showToast('Paramètres enregistrés');
  } catch (e: any) {
    alert(e?.data?.message ?? 'Erreur');
  } finally {
    saving.value = false;
  }
}
</script>

<script lang="ts">
// Composant Field inline pour DRY
import { defineComponent, h } from 'vue';
export const Field = defineComponent({
  name: 'Field',
  props: { label: String, modelValue: String, type: { type: String, default: 'text' }, hint: String },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('div', [
      h('label', { class: 'block text-sm mb-1' }, props.label),
      h('input', {
        type: props.type, value: props.modelValue,
        onInput: (e: any) => emit('update:modelValue', e.target.value),
        class: 'w-full px-3 py-2 border border-line',
      }),
      props.hint && h('p', { class: 'text-xs text-muted mt-1' }, props.hint),
    ]);
  },
});
</script>
```

> Note : si la duplication script-script lang fait des soucis, extraire `Field.vue` en composant séparé sous `components/admin/Field.vue`.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/composables/useSettings.ts apps/frontend/pages/admin/parametres/
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "feat(admin): page paramètres bulk-save + useSettings composable"
```

### Task M8.13: Smoke complet front admin

- [ ] **Step 1: Démarrer + tester chaque page admin manuellement**

```bash
COMPOSE_PROJECT_NAME=booking-resto docker compose up postgres mailhog -d
pnpm dev &
sleep 25
```

Naviguer dans le navigateur :
- http://localhost:3100/admin/login → login admin@example.fr / Admin1234! ✓
- /admin → dashboard avec KPI ✓
- /admin/reservations → liste vide initialement ✓
- /admin/horaires → 2 windows, 0 exceptions, modals ✓
- /admin/home → 2 sections, modal d'édition ✓
- /admin/menu → 0 docs, upload PDF ou image ✓
- /admin/messages → message créé en M5.8 visible ✓
- /admin/images → filter par section ✓
- /admin/parametres → modifier `brand_name`, save, vérifier en DB ✓

- [ ] **Step 2: Stopper**

```bash
kill %1
```

### Task M8.14: Milestone tag M8

```bash
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit --allow-empty -m "milestone(M8): frontend admin complet"
```

---

## Milestone 9 — Polish, docs, vault, smoke final (5 tâches)

**Output testable :** README et CLAUDE.md à jour, note Obsidian créée, CI verte, démo manuelle complète passe.

### Task M9.1: Réécrire `README.md`

**Files:**
- Modify (rewrite): `README.md`

- [ ] **Step 1: Contenu**

```markdown
# Booking-Resto

Template de site restaurant avec réservation en ligne (table-only, capacité globale, plages midi/soir, exceptions de fermeture, page d'accueil éditoriale, formulaire de contact). Fork mono-vertical du template [booking-pro](https://github.com/nicolasMaillard49/booking-pro).

## Stack

NestJS 10 · Nuxt 3 · Vue 3 · TypeScript 5 strict · Prisma 5 · PostgreSQL 16 · TailwindCSS · Resend (prod) / MailHog (dev) · Jest · pnpm 9 · Docker · Node ≥ 20.

## Démarrage local

```bash
pnpm install
COMPOSE_PROJECT_NAME=booking-resto docker compose up postgres mailhog -d
cd packages/prisma && DATABASE_URL="postgresql://booking:booking123@localhost:5440/booking_resto" npx prisma migrate dev && npx prisma db seed
cd ../.. && pnpm dev
```

- Public : http://localhost:3100
- Admin : http://localhost:3100/admin/login (`admin@example.fr` / `Admin1234!`)
- API : http://localhost:3101 (Swagger : `/api/docs`)
- MailHog : http://localhost:8025

## Architecture

Mono-tenant, mono-vertical resto. Voir `docs/superpowers/specs/2026-04-26-booking-resto-design.md` pour la spec complète.

Modules backend : `auth`, `bookings`, `service-windows`, `schedule-exceptions`, `home-sections`, `menu-documents`, `contact-messages`, `settings`, `images`, `notifications`, `public`, `stats`.

Pages publiques : `/` (home éditoriale), `/menu` (PDF/image), `/reservation` (tunnel 1-page).

Pages admin : `/admin`, `/admin/reservations`, `/admin/horaires`, `/admin/home`, `/admin/menu`, `/admin/messages`, `/admin/images`, `/admin/parametres`.

## Personnalisation par client

- **Theming** : `apps/frontend/tailwind.config.ts` (couleurs + polices), modifié par fork.
- **Contenu de base** : seed dans `packages/prisma/seed.ts` (admin, settings, plages midi/soir, sections d'exemple).
- **Configuration runtime** : page admin `/admin/parametres` (titre, sous-titre, contact, SEO, capacité, etc.).
- **Page menu** : upload images ou PDFs depuis `/admin/menu`.
- **Pour produire un site client à partir du template** : clone, rename (script à venir), seed, custom theming, deploy.

## Déploiement (recommandations)

- **DB** : Neon, Supabase ou Railway Postgres.
- **Backend** : Railway, Fly.io, Render (Docker friendly).
- **Frontend** : Vercel, Netlify (Nuxt 3 SSR-compatible).
- **Mail** : Resend (DNS SPF/DKIM/DMARC obligatoires sur le domaine d'envoi).
- **Domaine + TLS** : OVH/Cloudflare + Let's Encrypt automatique côté hébergeur.

Vars env prod minimales :
```env
DATABASE_URL=postgresql://...
JWT_SECRET=<32+ chars random>
JWT_REFRESH_SECRET=<32+ chars random>
FRONTEND_URL=https://restaurant.exemple.fr
RESEND_API_KEY=re_xxxxxxxxxxxx
MAIL_FROM="Mon Restaurant <reservation@exemple.fr>"
ADMIN_EMAIL=patron@exemple.fr
PORT=3101
TZ=Europe/Paris
```

## Hors scope (par design)

Stripe, SMS, multi-langue, gestion staff, table-spécifique (la capacité est globale), reviews internes, theming via UI admin, tests E2E. Voir spec §15.

## Roadmap

- Module épicerie (extension client si besoin)
- Tests E2E Playwright
- Migration images vers R2/S3 si dépassement capacité Postgres
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "docs: README adapté booking-resto"
```

### Task M9.2: Adapter `CLAUDE.md`

**Files:**
- Modify (rewrite): `CLAUDE.md`

- [ ] **Step 1: Contenu**

Réécrire en remplaçant les mentions multi-vertical par "mono-vertical resto", en listant les nouveaux modules backend et pages frontend, et en référençant les Setting keys (cf. spec §5). Hériter le format général du CLAUDE.md booking-pro mais adapter chaque section.

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit -m "docs(claude): MAJ pour booking-resto"
```

### Task M9.3: Note Obsidian

**Files:**
- Create: `D:\obsidian\MonCerveau\Projets\Templates\booking-resto.md`
- Modify: `D:\obsidian\MonCerveau\Projets\Templates\booking-pro.md`

- [ ] **Step 1: Créer la note**

```markdown
---
name: booking-resto
type: template
status: wip
complete: 100
stack: [NestJS 10, Nuxt 3, Vue 3, TypeScript 5, Prisma 5, PostgreSQL 16, TailwindCSS, Jest, Docker, pnpm workspaces, Resend]
cible: [restaurant]
offre: Site Réservation Resto 500 € HT
chemin: D:\projets\booking-resto
repo: https://github.com/nicolasMaillard49/booking-resto
parent: booking-pro
tags: [template, reservation, restaurant, monorepo]
created: 2026-04-26
updated: 2026-04-26
---

# booking-resto — Template de site restaurant

Fork vertical resto du template [[booking-pro]] (mono-tenant, mono-vertical).

## Différences clés vs booking-pro

- Modèle resa : `Booking { partySize, date, serviceWindowId? }` (pas de Service à durée fixe)
- Capacité globale réglable
- ServiceWindow multi-jours (replace Availability single-day)
- Auto-confirm sous seuil (défaut 6 couverts)
- Cron rappel J-1
- Page accueil éditoriale (N HomeSections drag-réordonnables)
- Page menu (images ou PDFs)
- Formulaire de contact (avec captcha)
- Resend SDK en prod (au lieu de SMTP générique)
- Module reviews supprimé

## Spec et plan

- Spec : `docs/superpowers/specs/2026-04-26-booking-resto-design.md`
- Plan d'implémentation : `docs/superpowers/plans/2026-04-26-booking-resto.md`
```

- [ ] **Step 2: MAJ booking-pro.md** : ajouter au tout début, après le frontmatter :

```markdown
> 🍽️ Variante resto extraite vers [[booking-resto]] le 2026-04-26.
```

### Task M9.4: CI vérifiée

**Files:**
- Modify if needed: `.github/workflows/ci.yml`

- [ ] **Step 1: Vérifier que la CI tourne sur push**

```bash
git push origin main
gh run watch
```
Expected: workflow vert (ou identifier les fails et les corriger).

- [ ] **Step 2: Si rouge, fixer**

Causes probables : variables env manquantes pour le test, package `resend` pas installé en CI, etc. Adapter `.github/workflows/ci.yml` (ex. `pnpm install --frozen-lockfile` + ajout `cp .env.example apps/backend/.env`).

### Task M9.5: Démo manuelle complète + milestone final

- [ ] **Step 1: Cycle e2e complet**

Suivre ce script utilisateur de bout en bout en navigateur :
1. Stack démarrée (`pnpm dev`).
2. Visiter http://localhost:3100/ → vérifier hero + sections + bloc contact (avec horaires auto).
3. Cliquer sur "Réserver" → choisir 2 couverts, demain, premier slot midi → form → confirmer → message succès.
4. Vérifier mail en MailHog (`http://localhost:8025`) : 1 confirmation client + 1 alerte admin.
5. Aller dans `/admin/reservations` → la résa apparaît en CONFIRMED.
6. Créer une seconde résa de 12 couverts → doit passer en PENDING.
7. Dans admin, valider la PENDING → mail "confirmation après pending" envoyé.
8. Cliquer le lien "annuler" dans un mail → page cancel rendue → résa passée en CANCELLED.
9. Aller dans `/admin/horaires` → ajouter une fermeture demain → retourner sur `/reservation` → vérifier "pas de créneaux" pour demain.
10. Aller dans `/admin/parametres` → changer `brand_name` → vérifier propagation sur la home.
11. Aller dans `/admin/menu` → uploader un PDF → vérifier qu'il apparaît dans `/menu` (embed inline).
12. Aller dans `/admin/messages` → un message du contact form devrait être présent (depuis M5.8 ou créé maintenant).

- [ ] **Step 2: Tag final**

```bash
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" tag -a v0.1.0 -m "booking-resto v0.1.0 — template MVP complet"
git push origin main --tags
git -c user.email=nico39320@gmail.com -c "user.name=Nicolas Maillard" commit --allow-empty -m "milestone(M9): booking-resto v0.1.0 ready"
git push
```

---

## Spec coverage check (self-review)

Pour vérifier que chaque section/exigence du spec est couverte par au moins une tâche :

| Spec section | Couvert par |
|---|---|
| §3 Setup repo | M0.1–M0.8, M9.3 (Obsidian) |
| §4 Schéma Prisma | M1.1, M1.2, M1.4 |
| §5 Setting keys | M1.5 (constants), M1.6 (service), M1.3 (seed), M8.12 (UI) |
| §6 Algorithme slots | M2.2, M2.3 |
| §7 Backend modules + routes | M2.4–M5.7, M6.1, M6.2 |
| §8 Frontend public | M7.1–M7.10 |
| §9 Frontend admin | M8.1–M8.13 |
| §10 Notifications (9 templates + cron + Resend) | M4.3–M4.9 |
| §11 Tests + CI + sécurité | TDD à chaque service + M9.4 |
| §12 Seed | M1.3 |
| §13 Déploiement | M9.1 (README) |
| §14 Documentation | M9.1, M9.2, M9.3 |
| §15 Hors-scope | Respecté (jamais implémenté) |

---

## Execution Handoff

**Plan complet et sauvegardé dans `docs/superpowers/plans/2026-04-26-booking-resto.md` (~98 tâches sur 9 milestones).** Étant donné la taille du projet, je recommande **fortement** une exécution par milestones — une session par milestone, validation utilisateur entre chaque, plutôt qu'un one-shot intégral.

Deux options d'exécution :

**1. Subagent-Driven (recommandé)** — Je dispatch un subagent par tâche, review entre les tâches, itération rapide, contexte principal protégé.

**2. Inline Execution** — Tâches exécutées dans la session courante via `superpowers:executing-plans`, batches avec checkpoints pour review.

**Quel mode tu préfères ?** Et **par quel milestone tu veux commencer** (M0 setup, ou un sous-ensemble si tu veux d'abord valider les choix backend) ?




