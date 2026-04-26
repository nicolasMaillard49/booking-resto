# Refactor mono-tenant — Design spec

**Date :** 2026-04-13
**Contexte :** Le projet `booking-pro` sert de **template à forker** (1 fork = 1 entreprise cliente), pas de SaaS multi-tenant. Retirer la notion de `Business` simplifie schéma/routes/auth sans rien coûter au métier.

## Principes directeurs

- **Minimalisme** : on touche uniquement ce qui porte la notion de tenant. Logique métier, enums, DTOs, validations : inchangés.
- **Fresh start** : la migration `init` multi-tenant est supprimée, une nouvelle `init` mono-tenant la remplace.
- **Pas de refactor opportuniste** hors du scope "dé-tenantification".

## 1. Schéma Prisma

**Suppression** du modèle `Business` et de toutes ses relations.

Sur chaque modèle lié (`Service`, `Booking`, `Availability`, `BlockedSlot`, `Review`, `User`) :
- suppression du champ `businessId` et de la relation `business`
- ajustement minimal des contraintes dépendantes :
  - `User` : `@@unique([businessId, email])` → `email String @unique`
  - `Availability` : `@@unique([businessId, dayOfWeek])` → `dayOfWeek Int @unique`
  - Les `@@index([businessId, …])` : la colonne `businessId` disparaît, on conserve les autres composantes si utiles (ex. `@@index([status])`, `@@index([date])`)

Tout le reste (enums `BookingStatus` / `PaymentStatus` / `UserRole`, types, champs, noms de colonnes, `@@map`) est identique au schéma actuel.

## 2. Routes backend

**Règle** : les endpoints publics anciennement préfixés par `/businesses/:slug/` sont regroupés sous `/public/*`. Les routes admin et auth restent identiques, sauf celles qui référençaient explicitement un `businessId`.

**Disparaissent**

- `GET /businesses/:slug` — remplacé par `GET /public/site` qui sert `siteConfig`
- `PATCH /businesses/:id` — la config est un fichier, plus d'update API

**Renommées**

| Avant | Après |
|---|---|
| `GET /businesses/:slug/services` | `GET /public/services` |
| `GET /businesses/:slug/schedule` | `GET /public/schedule` |
| `GET /businesses/:slug/availability` | `GET /public/availability-slots` |
| `GET /businesses/:slug/reviews` | `GET /public/reviews` |
| `GET /businesses/:id/stats` | `GET /stats` (admin) |

Le service stats migre de `BusinessModule` vers un nouveau `StatsModule` dédié.

**Inchangés**

- Auth : `POST /auth/login`, `/auth/refresh`, `/auth/logout`
- Services admin : `GET /services`, `POST /services`, `PATCH /services/:id`, `DELETE /services/:id`, `PATCH /services/reorder`
- Bookings : `POST /bookings` (public), `GET /bookings`, `GET /bookings/:id`, `PATCH /bookings/:id`, `DELETE /bookings/:id` (admin), `GET /bookings/:cancelToken/cancel`, `GET /bookings/:confirmToken/confirm`
- Availability admin : `PUT /availability`, `GET /availability/blocks`, `POST /availability/block`, `DELETE /availability/block/:id`
- Reviews : `POST /reviews` (public), `GET /admin/reviews`, `PATCH /reviews/:id`
- `GET /health`

## 3. Config `site.ts`

**Fichier** : `apps/backend/src/config/site.ts`, ré-exporté depuis `packages/shared` pour import direct côté frontend (évite un appel HTTP au boot).

```ts
export const siteConfig = {
  name: 'Salon Emma',
  type: 'coiffeur',
  description: '...',
  contact: {
    phone: '02 41 12 34 56',
    email: 'contact@salon-emma.fr',
    address: '12 rue des Lilas',
    city: 'Angers',
    postalCode: '49000',
  },
  branding: {
    primaryColor: '#8b5a2b',
    logo: '/logo.svg',
  },
  booking: {
    acceptPayment: false,
    stripePublicKey: '',
  },
} as const;

export type SiteConfig = typeof siteConfig;
```

**Usage**

- Backend : `GET /public/site` retourne `siteConfig`
- Frontend : `import { siteConfig } from '@booking-pro/shared/site'` pour nom, contact, SEO, couleurs Tailwind

**Secrets** (Stripe secret key, SMTP credentials, JWT secrets) : `.env`, jamais dans `site.ts`.

## 4. Frontend

Les pages `pages/[slug]/*` sont promues à la racine.

**Renommages**

| Avant | Après |
|---|---|
| `pages/[slug]/index.vue` | `pages/index.vue` |
| `pages/[slug]/avis/index.vue` | `pages/avis/index.vue` |
| `pages/[slug]/reservation/index.vue` | `pages/reservation/index.vue` |
| `pages/[slug]/reservation/confirmation/[token].vue` | `pages/reservation/confirmation/[token].vue` |
| `pages/[slug]/reservation/annuler/[cancelToken].vue` | `pages/reservation/annuler/[cancelToken].vue` |

**Adaptations**

- Chaque page publique remplace `$fetch('/businesses/${slug}/...')` par `$fetch('/public/...')`.
- Toute référence à `route.params.slug` est supprimée au profit d'un import `siteConfig`.
- Les appels admin `/businesses/:id/stats` deviennent `/stats`.
- `app.vue` et `nuxt.config.ts` lisent `siteConfig` pour les meta SEO par défaut (title, description).
- `apps/admin/` est déjà retiré du repo (commits antérieurs).

## 5. Seed, tests, migration

**Reset DB**

1. Suppression du dossier `packages/prisma/migrations/`
2. `prisma migrate reset --force`
3. `prisma migrate dev --name init` avec le nouveau schéma

**Seed `packages/prisma/seed.ts`**

- 1 admin (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` depuis `.env`, fallback dev `admin@example.fr` / `Admin1234!`)
- 3–4 `Service`
- 7 `Availability` (un par jour)
- 2–3 `Review` approuvés
- Aucun `BlockedSlot`

**Tests unitaires (`apps/backend/`)**

- `business.service.spec.ts` : supprimé
- `auth.service.spec.ts` : le mock user n'inclut plus `business`, le test "compte désactivé" est supprimé (plus de `business.isActive`)
- `availability.service.spec.ts` : les mocks retirent `user.businessId`, les assertions sur `upsert` / `create` ne contiennent plus de `businessId`
- Nouveau `stats.service.spec.ts` pour le `StatsService` migré

**Env backend** (`apps/backend/.env`)

- Ajout `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
- `DATABASE_URL`, `JWT_*`, `SMTP_*`, `PORT`, `FRONTEND_URL` : inchangés

**Docker-compose**

- Section `admin` déjà supprimée (commits antérieurs)
- Section `backend` inchangée

## Hors-scope (non traité par ce refactor)

- Refonte visuelle, nouveaux composants UI
- Changement de logique métier (règles de réservation, calcul de créneaux, validation)
- Ajout de features (paiement, notifications supplémentaires, i18n)
- Migration de la stack (Nuxt, NestJS, Prisma versions)

## Critères de succès

- `pnpm --filter backend test` : tous verts
- `pnpm --filter backend build` : zéro erreur TS
- `curl http://localhost:3101/health` → `200 {status:"ok", database:"connected"}`
- `curl http://localhost:3101/public/site` → JSON du `siteConfig`
- `http://localhost:3100/` affiche la home publique avec le nom/branding du `siteConfig`
- `http://localhost:3100/admin` login fonctionnel avec l'admin seedé
- Aucun symbole `businessId` ou `Business` ne subsiste dans `apps/backend/src/` ou `apps/frontend/`
