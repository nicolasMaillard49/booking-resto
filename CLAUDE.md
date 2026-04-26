# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Booking Pro is a multi-tenant online booking system for French service providers (hairdressers, osteopaths, driving schools, etc.). One backend + one database serves many businesses, each identified by a URL `slug` (e.g. `/salon-emma`). It is a pnpm monorepo with two apps and two shared packages.

## Repository layout

```
apps/
  backend/   NestJS 10 REST API                 :3101   (Swagger at /api/docs)
  frontend/  Nuxt 3 public site + admin panel   :3100
             ├─ /[slug]      SSR public zone (dynamic business routes)
             └─ /admin/**    SPA admin zone (ssr: false, noindex)
packages/
  prisma/    schema.prisma + migrations + seed (package name: @booking-resto/prisma)
  shared/    TypeScript types shared across apps (package name: @booking-resto/shared)
```

The admin panel was originally a separate Nuxt app (`apps/admin`) but was merged into `apps/frontend` as a zone. The split is now done via Nuxt `routeRules` in `apps/frontend/nuxt.config.ts`: `/admin/**` disables SSR and adds `X-Robots-Tag: noindex, nofollow`.

Workspaces are declared in `pnpm-workspace.yaml` / root `package.json`. Apps import shared types via `@booking-resto/shared` (which compiles to `dist/` — run `pnpm --filter shared build` if types get stale).

## Common commands

All commands run from the repo root unless stated otherwise.

```bash
# Install everything
pnpm install

# Run the two apps in parallel (requires DB already up)
pnpm dev

# Run a single app
pnpm --filter backend dev      # http://localhost:3101 — API + Swagger
pnpm --filter frontend dev     # http://localhost:3100 — public + /admin

# Build everything (order matters: shared → prisma client → apps)
pnpm build

# Lint / typecheck (runs across workspaces via `-r`)
pnpm lint
pnpm type-check

# Database (wrappers around packages/prisma scripts)
pnpm db:migrate    # prisma migrate dev
pnpm db:seed       # ts-node prisma/seed.ts
pnpm db:studio     # prisma studio
```

### Backend-specific

```bash
cd apps/backend
pnpm dev           # nest start --watch
pnpm build         # nest build → dist/
pnpm start         # node dist/main (prod)
pnpm test          # jest (unit tests)
pnpm test:watch
pnpm test -- path/to/file.spec.ts   # run a single test file
pnpm test -- -t "should generate slots"  # run by test name
```

### Prisma package-specific

Prisma commands need `DATABASE_URL` in the environment. From `packages/prisma/`:

```bash
DATABASE_URL="postgresql://booking:booking123@localhost:5440/booking_pro" npx prisma migrate dev --name init
DATABASE_URL="..." npx prisma db seed
DATABASE_URL="..." npx prisma studio
```

Note: `docker-compose.yml` exposes Postgres on host port **5440** (mapped to container 5432). `.env.example` shows 5432 — if you use the dockerized DB, use **5440** in your local `DATABASE_URL`.

### Dev infrastructure (Docker)

```bash
# DB + MailHog only (recommended for local dev; apps run on host)
docker-compose up postgres mailhog -d

# Full stack in containers
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

MailHog web UI: http://localhost:8025. SMTP on 1025.

### Required environment

`apps/backend/.env` must exist before running the backend. Copy from `.env.example` at the repo root. Key vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL` (CORS allow-list — a single origin now that admin is part of the frontend), `PORT`, and `SMTP_*`.

Seeded admin credentials (after `pnpm db:seed`) — sign in at `http://localhost:3100/admin/login`: `admin@salon-emma.fr / Admin1234!` for the `salon-emma` business.

## Architecture

### Multi-tenancy model

Every domain entity (`Service`, `Booking`, `Review`, `Availability`, `BlockedSlot`, `User`) is scoped to a `Business` via `businessId` (cascade delete). The public frontend routes by slug (`/salon-emma`), the admin panel scopes by the JWT's `businessId` claim. There is **no cross-tenant admin** — a logged-in user can only act on their own business.

See `packages/prisma/schema.prisma` for the full data model and enums (`BookingStatus`, `PaymentStatus`, `UserRole`).

### Backend (NestJS) structure

`apps/backend/src/`:
- `main.ts` — bootstrap: helmet, strict CORS (allow-list from `FRONTEND_URL`), global `ValidationPipe` (whitelist + forbidNonWhitelisted + transform), global `HttpExceptionFilter` and `TransformInterceptor`, Swagger at `/api/docs`.
- `app.module.ts` — root module wiring config, Prisma, and feature modules.
- `prisma/` — `PrismaService` (the single DB connector injected everywhere).
- `common/` — `filters/` (uniform error format), `guards/` (JWT auth guard), `decorators/` (`@Public()` to bypass the global guard, `@CurrentUser()`), `interceptors/` (response envelope transform).
- `modules/` — one folder per feature: `auth`, `business`, `services`, `bookings`, `reviews`, `availability`, `notifications`. Each typically has `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`.

Auth is JWT access + refresh. Routes are protected by default (global guard); mark public routes with `@Public()`. Admin endpoints read `req.user.businessId` and filter/scope all DB access by it.

### Booking slot algorithm (critical)

`BookingsService.generateSlots()` is the heart of the system. When computing availability for a date:

1. Check `Availability.isActive` for that weekday.
2. Fetch same-day bookings with status `PENDING` or `CONFIRMED`.
3. Fetch `BlockedSlot` rows for that date.
4. Generate 30-minute slots from open → close.
5. For each slot, mark `available: false` if it overlaps any occupied range. Overlap rule: `slotStart < occupiedEnd && slotEnd > occupiedStart`.
6. If the date is today, drop slots earlier than `now + 30min` buffer.

**The same check runs server-side again on `POST /bookings`** to prevent race conditions (two clients booking the same slot simultaneously). Do not remove this double-check.

Slot duration comes from `Service.duration` and is snapshotted into `Booking.duration` at creation time (so later service edits don't retroactively change past bookings).

### Email-based booking actions

Bookings generate unguessable `cancelToken` (always) and `confirmToken` (when needed). The public endpoints `GET /bookings/:cancelToken/cancel` and `GET /bookings/:confirmToken/confirm` are designed to be clicked from emails — no auth required, the token *is* the credential. Treat these tokens as secrets in logs.

### Frontend (Nuxt 3) — single app, two zones

`apps/frontend/` is Nuxt 3 with Tailwind + VueUse. It calls the backend via `NUXT_PUBLIC_API_URL` (default `http://localhost:3101`). One app serves **two zones** with different behaviour, configured in `nuxt.config.ts` via `routeRules`:

- **Public zone** — `pages/[slug]/**`: SSR enabled (SEO-critical). `index.vue` (landing + SEO/JSON-LD), `reservation/` (3-step booking tunnel), `avis/` (review form). Pages do not declare a layout, so they render their own full-page template. Dynamic primary color is injected at runtime from `business.config.couleur` via `app.vue`.
- **Admin zone** — `pages/admin/**`: SPA (`ssr: false`) with `X-Robots-Tag: noindex, nofollow`. Pages use `definePageMeta({ layout: 'admin', middleware: 'admin-auth' })`. The layout `layouts/admin.vue` renders the sidebar shell; `layouts/admin-auth.vue` is the minimal login wrapper. The `admin-auth` middleware reads JWT from localStorage and is gated behind `import.meta.server` so it no-ops during SSR.

Shared infrastructure (both zones):
- `composables/useAuth.ts` — wraps `$fetch` as `apiFetch` (injects Bearer token, handles refresh). SSR-safe: `getAuthHeader` returns `{}` on the server.
- `composables/useToast.ts` — global toast state.
- `components/admin/**` — admin-only UI (`AdminStatusBadge`, `AdminStatCard`, `AdminServiceForm`).
- `app.vue` — wraps `<NuxtPage />` in `<NuxtLayout>` so `definePageMeta({ layout })` applies. Missing this wrapper silently breaks layout resolution.

`typescript.typeCheck` is currently `false` because pre-existing `node_modules` type errors (Map/Set/Iterable) crash `vue-tsc`. Re-enable once the base tsconfig `lib` is fixed.

The shared package `@booking-resto/shared` exports DTO/entity types consumed by the frontend; after editing it, rebuild it (`pnpm --filter shared build`) so Nuxt picks up the new `dist/`.

## Stack summary

NestJS 10 · Prisma 5 · PostgreSQL 16 · Nuxt 3.12 · Vue 3.4 · Tailwind 3.4 · JWT + bcrypt · Nodemailer · Swagger · TypeScript 5.4 strict · pnpm 9 workspaces · Node ≥ 20.
