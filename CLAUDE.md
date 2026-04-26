# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Booking Resto** est un template mono-tenant + mono-vertical pour sites de restaurant avec réservation en ligne. Fork du template multi-vertical [booking-pro](https://github.com/nicolasMaillard49/booking-pro) extrait le 2026-04-26.

Différence centrale vs booking-pro : la résa porte sur une **table pour N convives** (`partySize`) sur une **plage de service** (midi/soir) au lieu d'une prestation à durée fixe pour 1 personne. Pas de modèle `Service`. Pas de modèle `Review`.

## Repository layout

```
apps/
  backend/   NestJS 10 REST API                 :3101  (Swagger /api/docs)
  frontend/  Nuxt 3 public + admin              :3100
             ├─ /                public (SSR)
             ├─ /menu            page menu (PDF/image embed)
             ├─ /reservation     tunnel 1-page (ssr:false)
             └─ /admin/**        SPA admin (ssr:false, noindex)
packages/
  prisma/    schema + migrations + seed
  shared/    types DTO/entity partagés
```

## Common commands

```bash
pnpm install
pnpm dev                                              # backend 3101 + frontend 3100
pnpm --filter backend test                            # Jest backend
pnpm --filter backend dev                             # backend seul (watch)
pnpm --filter frontend dev                            # frontend seul

pnpm db:migrate                                       # prisma migrate dev
pnpm db:seed                                          # seed admin + settings + windows + sections
pnpm db:studio                                        # prisma studio

# Docker dev infra
COMPOSE_PROJECT_NAME=booking-resto docker compose up postgres mailhog -d
```

## Architecture

### Backend modules

```
auth/                 # JWT login/refresh/logout
bookings/             # generateSlots + create + cancel/confirm tokens + admin CRUD
service-windows/      # plages récurrentes (label, daysOfWeek[], startTime, endTime)
schedule-exceptions/  # fermetures ponctuelles (startDate, endDate, reason)
home-sections/        # sections éditoriales home (drag-réordonnables)
menu-documents/       # documents page /menu (image OU PDF)
contact-messages/     # form contact public + captcha HMAC + admin CRUD
settings/             # whitelist clé/valeur + typed getters
images/               # bytea Postgres, accept image/* + application/pdf, max 5 Mo, magic-bytes check
notifications/        # MailerService abstrait (Nodemailer dev / Resend prod) + 9 templates HTML + cron J-1
public/               # /public/{site,schedule,home-sections,menu-documents,availability-slots}
stats/                # KPI couverts (today, midi/soir, chart 7j)
```

### Setting keys (whitelist)

Toutes définies dans `apps/backend/src/modules/settings/settings.constants.ts` :

| Clé | Type | Défaut |
|---|---|---|
| `capacity_max` | int | 30 |
| `default_meal_duration_min` | int | 90 |
| `auto_confirm_threshold` | int | 6 |
| `lookahead_days` | int | 90 |
| `cutoff_hours` | int | 2 |
| `slot_interval_min` | int | 15 |
| `week_starts_on` | int | 1 |
| `brand_name` | str | "Mon Restaurant" |
| `hero_title`, `hero_subtitle`, `hero_image_id` | str | … |
| `contact_address`, `contact_phone`, `contact_email` | str | … |
| `google_maps_embed_url`, `instagram_url` | str | "" |
| `seo_{home,menu}_{title,description}` | str | "" |

`PUT /admin/settings` rejette toute clé hors whitelist.

### Algorithme generateSlots

`BookingsService.generateSlots(date, partySize)` (cf. `bookings.service.ts`) :

1. Vérifie lookahead `[today, today + lookahead_days]`.
2. Vérifie aucune `ScheduleException` ne couvre la date.
3. Récupère `ServiceWindow` actives pour le jour ISO 1-7.
4. Pour chaque window, génère slots tous les `slot_interval_min` entre `startTime` et `endTime` **inclus**.
5. Pour chaque slot, somme `partySize` des bookings PENDING+CONFIRMED qui chevauchent (occupation = `default_meal_duration_min`).
6. Slot dispo si `Σ partySize + N ≤ capacity_max`.
7. Si date = aujourd'hui, drop slots avant `now + cutoff_hours`.

**Double-check serveur sur `POST /bookings`** (race condition guard).

### Confirmation policy

- `partySize ≤ auto_confirm_threshold` → CONFIRMED direct + mail récap client + alerte admin
- `partySize > auto_confirm_threshold` → PENDING + mail "demande reçue" client + alerte admin → admin valide → mail "confirmation après pending"

### Email templates (9)

`apps/backend/src/modules/notifications/templates/*.html` avec interpolation `{{var}}` et conditional `{{#var}}…{{/var}}` :

- booking-confirmed
- booking-pending
- booking-admin-alert
- booking-confirmed-after-pending
- booking-cancelled-by-admin
- booking-cancelled-by-client
- booking-cancelled-admin-notify
- booking-reminder (cron J-1, `0 10 * * *` Europe/Paris)
- contact-message-alert

### Mailer

`NotificationsModule` injecte `MAILER_PROVIDER` via factory : `NodemailerProvider` en dev (MailHog), `ResendProvider` en prod (SDK officiel).

### Sécurité

- Helmet + CORP `cross-origin` (pour servir images/PDFs cross-port en dev)
- CORS allow-list : dev `^http://localhost:\d+$`, prod `FRONTEND_URL`
- JWT access+refresh, bcrypt rounds 12
- `ValidationPipe` global (whitelist + forbidNonWhitelisted + transform)
- Rate-limit global 100/min, 5/min sur POST /bookings, 3/min sur POST /contact-messages
- Captcha HMAC signé pour `POST /contact-messages`
- Upload images/PDFs : whitelist mimeType + magic-bytes check (4 octets)

### Frontend

- Layout `default` (header + footer) pour public, layout `admin` (sidebar + bottom-nav mobile) pour admin
- Theming "Atelier" hérité (palette terre/crème, fonts Fraunces + DM Sans), modifiable dans `tailwind.config.ts` par fork
- Composables : `useAuth` (JWT localStorage), `useToast`, `useImageUpload`, `useSettings`, `useReservationFlow`
- Public utilise `useFetch` SSR, admin utilise `apiFetch` (JWT injection)
- `pages/admin/**` ont `ssr: false` + `definePageMeta({ middleware: 'admin-auth' })`

## Stack summary

NestJS 10 · Prisma 5 · PostgreSQL 16 · Nuxt 3.12 · Vue 3.4 · Tailwind 3.4 · JWT + bcrypt · Nodemailer · Resend · `@nestjs/schedule` · Swagger · TypeScript 5.4 strict · pnpm 9 workspaces · Node ≥ 20.

## Hors scope (par design)

Stripe, SMS, multi-langue, gestion staff/serveurs, table-spécifique (capacité globale uniquement), reviews internes (les restos utilisent Google Reviews), theming via UI admin, tests E2E. Voir spec §15.
