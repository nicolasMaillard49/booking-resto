# booking-resto — Design (fork vertical resto du template booking-pro)

**Date :** 2026-04-26
**Auteur :** Nicolas Maillard / NMF Agence (via Claude Code)
**Statut :** validé brainstorming, en attente de plan d'implémentation
**Repo cible :** `D:\projets\booking-resto` (nouveau, cloné depuis booking-pro)
**Repo parent :** `D:\projets\booking-pro` (template multi-vertical, mono-tenant)

---

## 1. Contexte et objectif

Le template `booking-pro` est un système de réservation mono-tenant pour artisans de service (coiffeur, ostéopathe, masseur, esthéticienne, auto-école…). Son journal mentionne déjà comme évolution future une **scission par vertical**.

Cette spec extrait la variante **restaurant** dans un repo dédié `booking-resto`, **template générique réutilisable** par n'importe quel restaurant (pas un projet client spécifique). Le modèle métier resto diffère trop de celui des artisans pour cohabiter dans une seule base de code :

- Pas de "service à durée fixe" (coupe homme 30 min) → réservation d'une **table pour N convives** sur une **plage de service** (midi/soir).
- Plusieurs plages d'ouverture par jour (12h-14h et 19h30-21h15) au lieu d'une seule plage continue.
- Capacité globale du resto au lieu d'agenda 1-personne.
- Page d'accueil entièrement éditoriale, pas une landing prestation.
- Mécaniques d'admin spécifiques (auto-confirm sous seuil, cron rappel J-1, exceptions de fermeture).

Le fork est **irréversible** (suppression de modèles Prisma, redéfinition des concepts) — on ne peut pas garder une branche réconciliable avec `main` du template salon. D'où le choix d'un repo séparé.

## 2. Décisions structurantes (issues du brainstorming)

| Sujet | Décision |
|---|---|
| Modèle de réservation | Table-only : `Booking { partySize, date, serviceWindowId? }`. Drop modèle `Service`. |
| Capacité | Globale, réglable depuis l'admin (`Setting.capacity_max`). |
| Plages horaires | Nouveau modèle `ServiceWindow { label, daysOfWeek: Int[], startTime, endTime }`. Drop `Availability` et `BlockedSlot`. |
| Exceptions | `ScheduleException { startDate, endDate, reason }` — fermetures only (pas d'override d'horaires). |
| Tunnel public | Page unique : couverts + date + créneau + nom + email + tél (obligatoire) + notes. Pas de CGU. |
| Confirmation | Auto-confirm si `partySize ≤ Setting.auto_confirm_threshold` (défaut 6), sinon `PENDING` avec validation manuelle. |
| Rappels | Email J-1 par cron quotidien (10h Europe/Paris). Pas de SMS. |
| Réglages admin | Lookahead 90j, cutoff 2h, intervalle 15 min, capacité 30, seuil 6, durée moyenne repas 90 min, semaine débute lundi, date pré-sélection auto, admin ignore schedule. |
| Page d'accueil | N sections flexibles (drag), layout image+texte côte à côte alterné gauche/droite auto, hero éditable (image + titre + sous-titre + 2 CTA Menu/Réserver), bloc final horaires + adresse + maps + tél + email + formulaire de contact. |
| Page Menu | `/menu` interne. Liste de `MenuDocument { title, description, file }` où le fichier est une image OU un PDF affiché inline. |
| Avis | Module `reviews` **droppé** (les restos utilisent Google Reviews / TheFork). |
| Formulaire de contact | Stocké en DB (`ContactMessage`) + email d'alerte admin. |
| Theming | Hardcodé par fork (Tailwind config + polices). Pas d'UI admin de theming. |
| Sections home | Un seul type (image + texte alterné). |
| Phasage | One-shot (pas de V1/V2/V3). |
| Mailer prod | **Resend SDK**. Dev = MailHog (Nodemailer). |

## 3. Setup repo (étape 0 avant tout code)

```bash
# Clone depuis le template
git clone D:\projets\booking-pro D:\projets\booking-resto
cd D:\projets\booking-resto

# Détacher du remote source
git remote remove origin

# Reset historique (template propre)
rm -rf .git
git init -b main
git add -A
git commit -m "chore: initial fork from booking-pro template"

# Nouveau repo GitHub
gh repo create nicolasMaillard49/booking-resto --private --source=. --remote=origin --push
```

**Renommage cosmétique** :
- `package.json` (root + apps + packages) : `name` `booking-pro` → `booking-resto`, packages `@booking-pro/*` → `@booking-resto/*`.
- `README.md` : nouveau contenu resto.
- `CLAUDE.md` : MAJ description (mono-vertical resto).
- Docker : `booking_pro_db` / `booking_pro_mail` → `booking_resto_db` / `booking_resto_mail`. `COMPOSE_PROJECT_NAME=booking-resto`.
- DB name : `booking_pro` → `booking_resto`.
- Ports inchangés (3100 / 3101 / 5440 / 8025) — possible conflit si les deux projets tournent en même temps, à gérer ad hoc avec ports alternatifs ou arrêt de l'un.

**Vault Obsidian** :
- Créer `D:\obsidian\MonCerveau\Projets\Templates\booking-resto.md` (frontmatter `type: template`, `cible: [restaurant]`, `complete: 0`, `parent: booking-pro`).
- Ajouter une note dans `booking-pro.md` : "🍽️ Variante resto extraite vers [[booking-resto]] le 2026-04-26".

## 4. Schéma Prisma

```prisma
generator client { provider = "prisma-client-js" }
datasource db    { provider = "postgresql"; url = env("DATABASE_URL") }

// ── Booking ─────────────────────────────────────────────────
model Booking {
  id               String        @id @default(cuid())
  partySize        Int
  date             DateTime
  serviceWindowId  String?
  clientName       String
  clientEmail      String
  clientPhone      String
  notes            String?       @db.Text
  status           BookingStatus @default(PENDING)
  cancelToken      String        @unique @default(cuid())
  confirmToken     String?       @unique
  confirmedAt      DateTime?
  cancelledAt      DateTime?
  reminderSentAt   DateTime?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  serviceWindow    ServiceWindow? @relation(fields: [serviceWindowId], references: [id], onDelete: SetNull)

  @@index([date])
  @@index([status])
  @@index([cancelToken])
  @@index([confirmToken])
  @@index([reminderSentAt])
  @@map("bookings")
}

// ── ServiceWindow ───────────────────────────────────────────
model ServiceWindow {
  id          String   @id @default(cuid())
  label       String
  daysOfWeek  Int[]                    // ISO 1=lun..7=dim
  startTime   String                   // "HH:mm"
  endTime     String
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  bookings    Booking[]

  @@map("service_windows")
}

// ── ScheduleException ───────────────────────────────────────
model ScheduleException {
  id        String   @id @default(cuid())
  startDate DateTime @db.Date
  endDate   DateTime @db.Date
  reason    String?
  createdAt DateTime @default(now())

  @@index([startDate, endDate])
  @@map("schedule_exceptions")
}

// ── HomeSection ─────────────────────────────────────────────
model HomeSection {
  id          String   @id @default(cuid())
  title       String
  body        String   @db.Text
  imageId     String?
  sortOrder   Int      @default(0)
  isPublished Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  image       Image?   @relation(fields: [imageId], references: [id], onDelete: SetNull)

  @@index([sortOrder])
  @@map("home_sections")
}

// ── MenuDocument ────────────────────────────────────────────
model MenuDocument {
  id          String   @id @default(cuid())
  title       String
  description String?  @db.Text
  fileId      String
  sortOrder   Int      @default(0)
  isPublished Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  file        Image    @relation(fields: [fileId], references: [id], onDelete: Restrict)

  @@map("menu_documents")
}

// ── ContactMessage ──────────────────────────────────────────
model ContactMessage {
  id        String   @id @default(cuid())
  name      String
  email     String
  message   String   @db.Text
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([isRead, createdAt])
  @@map("contact_messages")
}

// ── Image (étendu : accepte images ET PDFs) ─────────────────
model Image {
  id        String       @id @default(cuid())
  section   ImageSection
  sortOrder Int          @default(0)
  caption   String?
  mimeType  String                       // image/jpeg | image/png | image/webp | application/pdf
  width     Int?                         // null si PDF
  height    Int?                         // null si PDF
  size      Int
  data      Bytes
  createdAt DateTime     @default(now())

  homeSections   HomeSection[]
  menuDocuments  MenuDocument[]

  @@index([section, sortOrder])
  @@map("images")
}

// ── Setting (clé/valeur, cast par SettingsService) ──────────
model Setting {
  key       String   @id
  value     String   @db.Text
  updatedAt DateTime @updatedAt

  @@map("settings")
}

// ── User ────────────────────────────────────────────────────
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  role         UserRole  @default(ADMIN)
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@map("users")
}

// ── Enums ───────────────────────────────────────────────────
enum BookingStatus { PENDING CONFIRMED CANCELLED COMPLETED NO_SHOW }
enum UserRole      { ADMIN MANAGER }
enum ImageSection  { HERO HOMESECTION MENU OTHER }
```

**Modèles supprimés vs booking-pro** : `Service`, `Availability`, `BlockedSlot`, `Review`, enum `PaymentStatus`, enum sections `ABOUT/GALLERY/SERVICE`, champs `paymentStatus/stripeSessionId/amount/duration` du `Booking`.

**Migration Prisma** : fraîche. On droppe `packages/prisma/migrations/*` du fork et on génère un seul `init` migration sur le nouveau schema.

## 5. Setting keys — référence

Liste exhaustive des clés `Setting` autorisées (whitelistées dans `SettingsService.ALLOWED_KEYS`) :

| Clé | Type | Défaut | Description |
|---|---|---|---|
| `capacity_max` | int | 30 | Couverts max simultanés. |
| `default_meal_duration_min` | int | 90 | Durée moyenne d'un repas (utilisée pour calculer l'occupation d'un slot). |
| `auto_confirm_threshold` | int | 6 | Au-delà : booking en PENDING. |
| `lookahead_days` | int | 90 | Réservation au plus tôt N jours à l'avance. |
| `cutoff_hours` | int | 2 | Délai minimum avant créneau. |
| `slot_interval_min` | int | 15 | Intervalle entre créneaux générés (10/15/30). |
| `week_starts_on` | int | 1 | 1=lundi, 7=dimanche (ISO). |
| `brand_name` | str | "Mon Restaurant" | Nom de l'établissement. |
| `hero_title` | str | "Bienvenue chez [Brand]" | H1 du hero. |
| `hero_subtitle` | str | "" | Sous-titre du hero. |
| `hero_image_id` | str? | null | FK vers Image (section HERO). |
| `contact_address` | str | "" | Adresse postale. |
| `contact_phone` | str | "" | Téléphone (cliquable `tel:`). |
| `contact_email` | str | "" | Email (cliquable `mailto:`). |
| `google_maps_embed_url` | str | "" | `src` de l'iframe Google Maps. |
| `instagram_url` | str | "" | URL profil Instagram. |
| `seo_home_title` | str | "" | `<title>` page d'accueil. |
| `seo_home_description` | str | "" | `<meta name="description">` accueil. |
| `seo_menu_title` | str | "" | `<title>` page menu. |
| `seo_menu_description` | str | "" | `<meta name="description">` menu. |

**Toute clé non présente dans cette whitelist est rejetée par `PUT /admin/settings`** (sécurité contre pollution arbitraire).

## 6. Algorithme de génération de slots

Pour `GET /public/availability-slots?date=YYYY-MM-DD&partySize=N` :

1. Vérifier que la date est dans la fenêtre `[today, today + lookahead_days]`. Sinon `[]`.
2. Vérifier qu'aucune `ScheduleException` ne couvre la date (`startDate ≤ date ≤ endDate`). Si oui, fermé → `[]`.
3. Calculer le `dayOfWeek` ISO (1-7) de la date.
4. Récupérer toutes les `ServiceWindow` actives où `daysOfWeek` contient ce jour. Si aucune → fermé → `[]`.
5. Pour chaque window, générer des slots tous les `slot_interval_min` entre `startTime` et `endTime` **inclus** (`endTime` = dernière heure de placement autorisée, pas l'heure de fermeture cuisine). Exemple : window `12:00→14:00` avec `slot_interval_min=15` → slots `12:00, 12:15, …, 13:45, 14:00`.
6. Récupérer les `Booking` du jour avec `status IN (PENDING, CONFIRMED)`. Pour chacun calculer `(start, end) = (booking.date, booking.date + default_meal_duration_min)`.
7. Pour chaque slot candidat `(slotStart, slotEnd = slotStart + default_meal_duration_min)` :
   - Sommer `partySize` des bookings dont `(bookingStart < slotEnd && bookingEnd > slotStart)`.
   - Slot disponible si `Σ partySize + N ≤ capacity_max`.
8. Si la date est aujourd'hui, drop slots où `slotStart < now + cutoff_hours`.
9. Renvoyer slots groupés par `serviceWindowId` (pour affichage UI "Service Midi" / "Service Soir").

**Double-check serveur sur `POST /bookings`** : recalculer la dispo juste avant `prisma.booking.create()` dans la même transaction (race condition guard hérité du template salon).

## 7. Backend NestJS — modules et routes

### Structure modules

```
auth/                 # héritage
bookings/             # adapté
service-windows/      # nouveau
schedule-exceptions/  # nouveau
home-sections/        # nouveau
menu-documents/       # nouveau
contact-messages/     # nouveau
settings/             # nouveau
images/               # étendu (PDF, 5 Mo)
notifications/        # adapté + cron J-1 + Resend
public/               # adapté
stats/                # adapté
```

### Routes

#### `bookings/`
| Méthode | Route | Auth |
|---|---|---|
| POST | `/bookings` | public (rate-limit 5/min/IP) |
| GET | `/bookings/:cancelToken/cancel` | public |
| GET | `/bookings/:confirmToken/confirm` | public |
| GET | `/bookings` | admin (filtres date/status/search, pagination) |
| GET | `/bookings/agenda?from=&to=` | admin (vue semaine groupée par jour) |
| GET | `/bookings/:id` | admin |
| PATCH | `/bookings/:id` | admin |
| DELETE | `/bookings/:id` | admin |

#### `service-windows/`
| Méthode | Route | Auth |
|---|---|---|
| GET / POST / PATCH /:id / DELETE /:id | `/service-windows` | admin |
| PATCH | `/service-windows/reorder` | admin |

#### `schedule-exceptions/`
| Méthode | Route | Auth |
|---|---|---|
| GET / POST / DELETE /:id | `/schedule-exceptions` | admin |

#### `home-sections/`
| Méthode | Route | Auth |
|---|---|---|
| GET / POST / PATCH /:id / DELETE /:id | `/admin/home-sections` | admin |
| PATCH | `/admin/home-sections/reorder` | admin |

#### `menu-documents/`
| Méthode | Route | Auth |
|---|---|---|
| GET / POST / PATCH /:id / DELETE /:id | `/admin/menu-documents` | admin |
| PATCH | `/admin/menu-documents/reorder` | admin |

#### `contact-messages/`
| Méthode | Route | Auth |
|---|---|---|
| POST | `/contact-messages` | public (rate-limit 3/min/IP, captcha) |
| GET | `/admin/contact-messages` | admin |
| PATCH | `/admin/contact-messages/:id` | admin (toggle isRead) |
| DELETE | `/admin/contact-messages/:id` | admin |

#### `settings/`
| Méthode | Route | Auth |
|---|---|---|
| GET | `/admin/settings` | admin (regroupé par catégorie) |
| PUT | `/admin/settings` | admin (bulk, validation whitelist) |

#### `images/`
| Méthode | Route | Auth |
|---|---|---|
| GET | `/images/:id` | public (Content-Type selon mimeType, Cache-Control immutable) |
| POST | `/admin/images` | admin (multipart, max 5 Mo, accept image/* + application/pdf) |
| GET | `/admin/images?section=` | admin |
| PATCH | `/admin/images/:id` | admin |
| DELETE | `/admin/images/:id` | admin (Restrict si référencé par MenuDocument) |
| PATCH | `/admin/images/reorder` | admin |

#### `public/`
| Méthode | Route |
|---|---|
| GET | `/public/site` (toutes les Settings publiques) |
| GET | `/public/home-sections` (publiées, triées) |
| GET | `/public/menu-documents` (publiés, triés) |
| GET | `/public/availability-slots?date=&partySize=` |
| GET | `/public/schedule` (ServiceWindows actives, pour afficher horaires home) |

#### `stats/`
| Méthode | Route |
|---|---|
| GET | `/stats?from=&to=` (couverts, taux remplissage midi/soir, chart 7j) |

### Sécurité

- Helmet + CORP `cross-origin` (servir images/PDFs).
- CORS allow-list : dev `^http://localhost:\d+$`, prod `FRONTEND_URL`.
- JWT access + refresh, bcrypt rounds 12.
- ValidationPipe global : `whitelist + forbidNonWhitelisted + transform`.
- Upload : whitelist mimeType + magic-bytes check (`file-type`).
- Captcha math signé JWT 10 min sur formulaire contact.
- `SettingsService.ALLOWED_KEYS` : seul une clé whitelistée passe en `PUT /admin/settings`.

## 8. Frontend public Nuxt 3

### Pages

```
apps/frontend/pages/
├─ index.vue                         # accueil
├─ menu/index.vue                    # liste verticale MenuDocuments
├─ reservation/index.vue             # tunnel 1-page (ssr: false)
└─ reservation/[token]/cancel.vue
└─ reservation/[token]/confirm.vue
```

### `index.vue` — composition

```
<Hero>                       # image fond Setting.hero_image_id, overlay, h1, subtitle, [Menu][Réserver]
<HomeSection v-for>          # alternance auto image-left/image-right via index % 2
<ContactBlock id="contact">  # horaires auto (ServiceWindows) + adresse + maps + tél/email + form
```

Récupération SSR : un seul `useAsyncData` qui `Promise.all` sur `/public/site`, `/public/home-sections`, `/public/schedule`.

### `menu/index.vue`

Liste verticale empilée. Pour chaque `MenuDocument` :
- `<h2>title</h2>` + `<p>description</p>`
- Image : `<NuxtImg src="/images/:fileId">`
- PDF : `<embed src="/images/:fileId" type="application/pdf">` + bouton fallback "Télécharger".

### `reservation/index.vue` — tunnel 1-page

`ssr: false`. Composant unique avec composable `useReservationFlow()` :

1. Sélecteur couverts (chips 1–7 + "8+" qui ouvre champ libre).
2. DatePicker (jours fermés/passés grisés selon `ScheduleException` + `lookahead_days`).
3. Liste slots groupés par `ServiceWindow.label` (refetch à chaque changement date/couverts).
4. Form coordonnées (nom, email, **tél obligatoire**).
5. Notes (textarea optionnelle).
6. CTA "Confirmer la réservation".
7. Affichage success selon `status` retourné (`CONFIRMED` → "Votre table est confirmée", `PENDING` → "Demande reçue, validation sous 24h").

### Header / Footer

- Header sticky : Logo / Brand + `Accueil` `Menu` `Réserver` `Contact`. Mobile burger.
- Footer minimaliste : copyright + Instagram.

### SEO

- `Restaurant` JSON-LD sur `/`, `Menu` JSON-LD sur `/menu`.
- `openingHoursSpecification` généré depuis `ServiceWindows`.
- Meta titles/descriptions configurables via Settings.

### Theming par défaut

- Titres : Cormorant Garamond (alt : Playfair Display).
- Corps : Inter ou Manrope.
- Palette : terre/crème (`#FAF7F2` fond, `#1A1A1A` texte, `#8B6F47` accent).
- Modifiable dans `tailwind.config.ts` par fork.

## 9. Frontend admin Nuxt 3

### Pages

```
apps/frontend/pages/admin/
├─ login.vue              # héritage
├─ index.vue              # dashboard adapté
├─ reservations/index.vue # liste + agenda semaine (couverts)
├─ horaires/index.vue     # ServiceWindows + ScheduleExceptions sur même page
├─ home/index.vue         # éditeur HomeSections (drag, modal CRUD)
├─ menu/index.vue         # éditeur MenuDocuments (drag, modal CRUD)
├─ messages/index.vue     # boîte ContactMessages
├─ images/index.vue       # galerie filtrée par section
└─ parametres/index.vue   # tous Settings, bulk save
```

### Sidebar

```
🏠 Dashboard          /admin
📅 Réservations       /admin/reservations
⏰ Horaires           /admin/horaires
─────────────
🏡 Page d'accueil     /admin/home
🍽️ Menu               /admin/menu
✉️ Messages           /admin/messages   (badge nb non lus)
🖼️ Images             /admin/images
⚙️ Paramètres         /admin/parametres
─────────────
🚪 Déconnexion
```

### Dashboard KPIs

- Couverts aujourd'hui (somme partySize CONFIRMED).
- Réservations aujourd'hui (count).
- En attente de validation (count PENDING) — clic → filter reservations.
- Taux remplissage midi / soir (jour J).
- Card "Semaine à venir" (héritée).
- Chart 7j Chart.js (couverts/jour, courbe + tendance, héritée).
- Card stats période configurable (héritée).

### Page Paramètres (bulk update)

Cards regroupées : Réservations / Page d'accueil / Contact / SEO. Un seul bouton "Enregistrer" en bas, `PUT /admin/settings` une fois avec tout le diff.

### Composables

- `useAuth.ts` (héritage)
- `useToast.ts` (héritage)
- `useImageUpload.ts` (étendu : accepte PDF, skip resize si PDF)
- `useSettings.ts` (nouveau : cache des Settings, getter/setter typé)

## 10. Notifications

### Templates email (9)

| Trigger | Destinataire | Template |
|---|---|---|
| POST /bookings auto-confirmé | client | `booking-confirmed.html` |
| POST /bookings PENDING | client | `booking-pending.html` |
| POST /bookings (toujours) | admin | `booking-admin-alert.html` |
| Admin valide une PENDING | client | `booking-confirmed-after-pending.html` |
| Admin annule via UI | client | `booking-cancelled-by-admin.html` |
| Client clique cancelToken | client | `booking-cancelled-by-client.html` |
| Client clique cancelToken | admin | `booking-cancelled-admin-notify.html` |
| Cron J-1 à 10h | client | `booking-reminder.html` |
| POST /contact-messages | admin | `contact-message-alert.html` |

### Cron J-1

`@nestjs/schedule` cron `0 10 * * *` Europe/Paris. Sélectionne `Booking` `CONFIRMED` avec `date` dans 23–25h et `reminderSentAt IS NULL`. Envoie + set `reminderSentAt`.

### Stack mailer

- Dev : `NodemailerProvider` → MailHog.
- Prod : `ResendProvider` (SDK `resend`).
- Abstraction `MailerService.send(template, data)`. Injection conditionnelle via factory `NODE_ENV === 'production' ? ResendProvider : NodemailerProvider`.
- Vars env prod : `RESEND_API_KEY`, `MAIL_FROM`, `ADMIN_EMAIL`.
- Domaine à vérifier (SPF/DKIM/DMARC) côté Resend avant chaque go-live client.

### Anti-spam contact

- Captcha math côté client (style "10 + 15 = ?"), validé côté serveur via JWT temporaire 10 min.
- Rate-limit 3/min/IP.
- Validation stricte email (`@IsEmail`).

## 11. Tests, CI

### Cible

> 100 tests Jest, couverture ≥ 90 % sur services critiques (`bookings`, `notifications`).

### Suites

| Suite | Couverture |
|---|---|
| `bookings.service.spec.ts` | Slot generation multi-windows, capacity overlap, cutoff, lookahead, exception blocking, auto-confirm vs PENDING, race condition double-check, tokens. |
| `service-windows.service.spec.ts` | CRUD, validation `daysOfWeek` (1-7, no doublon), HH:mm, `endTime > startTime`. |
| `schedule-exceptions.service.spec.ts` | CRUD, validation `endDate >= startDate`, helper `isDateBlocked`. |
| `home-sections.service.spec.ts` | CRUD + reorder, cascade SetNull. |
| `menu-documents.service.spec.ts` | CRUD + reorder, accept image OU PDF, refus autre mimeType. |
| `contact-messages.service.spec.ts` | Create + mark-read + delete, validation captcha. |
| `settings.service.spec.ts` | Typed getters, cast, defaults, whitelist. |
| `images.service.spec.ts` | Hérité + accept PDF (skip resize), refus > 5 Mo, refus mimeType non whitelisté. |
| `notifications.service.spec.ts` | 9 templates (subject + variables), cron J-1 (sélection + idempotence), Resend provider mocké. |
| `auth.service.spec.ts` | Hérité. |
| `stats.service.spec.ts` | Couverts/jour, taux remplissage midi/soir, chart 7j. |

### CI GitHub Actions

`.github/workflows/ci.yml` hérité, étapes : install → shared build → prisma generate → backend test → backend build → frontend build. Trigger push + PR sur `main`.

### Hors scope

- Tests E2E Playwright.
- Tests Vitest frontend.
- Stripe / paiement.
- Multi-langue.
- SMS.
- Réservation de table spécifique (capacité globale uniquement).
- Gestion staff / serveurs.
- Module épicerie (peut être ajouté plus tard par client).

## 12. Seed (`packages/prisma/seed.ts`)

```ts
// Admin
{ email: 'admin@example.fr', password: 'Admin1234!', role: ADMIN }

// Settings : toutes les clés avec leur valeur par défaut (cf. §5)

// 2 ServiceWindows d'exemple :
{ label: "Service Midi", daysOfWeek: [2,3,4,5,6], startTime: "12:00", endTime: "14:00" }
{ label: "Service Soir", daysOfWeek: [3,4,5,6],   startTime: "19:30", endTime: "21:15" }

// 2 HomeSections d'exemple : "Notre cuisine" + "Notre histoire" (lorem ipsum)

// MenuDocuments : aucun
// ScheduleExceptions : aucune
// Bookings : aucune
// ContactMessages : aucun
```

Volontairement léger — c'est un template, pas un site finalisé.

## 13. Déploiement (recommandations README)

| Composant | Reco |
|---|---|
| DB | Neon (Postgres serverless) |
| Backend | Railway ou Fly.io (Docker) |
| Frontend | Vercel ou Netlify |
| Mail | Resend (validation domaine SPF/DKIM/DMARC obligatoire) |
| Domaine + TLS | OVH / Cloudflare (Let's Encrypt auto) |

Vars env prod minimales :
```env
DATABASE_URL=postgresql://...
JWT_SECRET=<32+ chars>
JWT_REFRESH_SECRET=<32+ chars>
FRONTEND_URL=https://restaurant.exemple.fr
RESEND_API_KEY=re_xxx
MAIL_FROM="Mon Restaurant <reservation@exemple.fr>"
ADMIN_EMAIL=patron@exemple.fr
PORT=3101
TZ=Europe/Paris
```

## 14. Documentation

### `README.md` du nouveau repo
1. Pitch (template resto, fork de booking-pro)
2. Stack
3. Démarrage local (clone + docker + migrate + seed + dev)
4. Architecture (mono-tenant, mono-vertical resto, schema overview)
5. Personnalisation par client (theming hardcodé, env vars, settings via UI admin)
6. Déploiement (cf. §13)
7. Roadmap

### `CLAUDE.md` du nouveau repo
- Mono-vertical resto.
- Modèle resa = couverts + table-only.
- Liste modules backend.
- Liste pages admin/public.
- Liste Setting keys (cf. §5).

### Vault Obsidian
- `Projets/Templates/booking-resto.md` créé (frontmatter `parent: booking-pro`).
- `Projets/Templates/booking-pro.md` mis à jour (lien vers variante resto).

## 15. Scope explicite hors-spec

Ces points sont **volontairement absents** du template, pourront être ajoutés par projet :
- Stripe / acompte / paiement en ligne.
- SMS de rappel.
- Multi-langue.
- Module épicerie (ajout possible par client comme pour La Rencontre).
- Réservation de table spécifique (vs capacité globale).
- Gestion staff / serveurs.
- Theming via UI admin.
- Tests E2E.

## 16. Suite

Une fois cette spec validée par l'utilisateur, invoquer la skill `superpowers:writing-plans` pour produire un plan d'implémentation détaillé (tâches granulaires, ordre, critères d'acceptation par tâche). Le plan déclenchera la création réelle du repo `booking-resto` en première étape.
