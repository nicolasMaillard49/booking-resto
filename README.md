# Booking Resto

Template de site restaurant avec réservation en ligne (table-only, capacité globale, plages midi/soir, exceptions de fermeture, page d'accueil éditoriale, page menu image/PDF, formulaire de contact). Fork mono-vertical du template [booking-pro](https://github.com/nicolasMaillard49/booking-pro).

## Stack

NestJS 10 · Nuxt 3 · Vue 3 · TypeScript 5 strict · Prisma 5 · PostgreSQL 16 · TailwindCSS · Resend (prod) / MailHog (dev) · Jest · pnpm 9 · Docker · Node ≥ 20.

## Démarrage local

```bash
pnpm install
COMPOSE_PROJECT_NAME=booking-resto docker compose up postgres mailhog -d
cd packages/prisma && DATABASE_URL="postgresql://booking:booking123@localhost:5440/booking_resto" npx prisma migrate dev && npx prisma db seed
cd ../..
pnpm dev
```

- **Public** : http://localhost:3100
- **Admin** : http://localhost:3100/admin/login (`admin@example.fr` / `Admin1234!`)
- **API** : http://localhost:3101 (Swagger : `/api/docs`)
- **MailHog** : http://localhost:8025

## Architecture

Mono-tenant, mono-vertical resto. Voir `docs/superpowers/specs/2026-04-26-booking-resto-design.md` pour la spec complète.

**Modules backend** : `auth`, `bookings`, `service-windows`, `schedule-exceptions`, `home-sections`, `menu-documents`, `contact-messages`, `settings`, `images`, `notifications`, `public`, `stats`.

**Pages publiques** : `/` (home éditoriale), `/menu` (PDF/image), `/reservation` (tunnel 1-page).

**Pages admin** : `/admin`, `/admin/reservations`, `/admin/horaires`, `/admin/home`, `/admin/menu`, `/admin/messages`, `/admin/images`, `/admin/parametres`.

## Modèle de réservation

- Une résa = `partySize` (couverts) + `date` + créneau d'une `ServiceWindow`
- Capacité globale plafonnée par `Setting.capacity_max`
- Auto-confirm si `partySize ≤ Setting.auto_confirm_threshold` (défaut 6), sinon PENDING avec validation manuelle admin
- Tokens email pour annulation/confirmation
- Cron J-1 quotidien (10h Europe/Paris) pour rappels mail

## Personnalisation par client

- **Theming** : `apps/frontend/tailwind.config.ts` (palette + polices), modifié par fork
- **Contenu de base** : seed dans `packages/prisma/seed.ts` (admin, settings, plages midi/soir, sections d'exemple)
- **Configuration runtime** : page admin `/admin/parametres` (titre, sous-titre, contact, SEO, capacité, etc.)
- **Page menu** : upload images ou PDFs depuis `/admin/menu`

## Déploiement (recommandations)

| Composant | Reco |
|---|---|
| DB | Neon (Postgres serverless) |
| Backend | Railway, Fly.io, Render (Docker) |
| Frontend | Vercel ou Netlify |
| Mail | Resend (DNS SPF/DKIM/DMARC obligatoires sur le domaine d'envoi) |
| Domaine + TLS | OVH / Cloudflare (Let's Encrypt auto via host) |

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

Stripe, SMS, multi-langue, gestion staff, table-spécifique (capacité globale), reviews internes, theming via UI admin, tests E2E. Voir spec §15.

## Roadmap

- Module épicerie (extension client si besoin)
- Tests E2E Playwright
- Migration images vers R2/S3 si dépassement capacité Postgres
