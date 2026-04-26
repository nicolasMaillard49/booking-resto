# Design — Merge admin app into frontend (single Nuxt app, single port)

**Date:** 2026-04-11
**Status:** Approved
**Context:** The project currently ships two Nuxt apps (`apps/frontend` on port 3100 and `apps/admin` on port 3102). The user wants a single application on a single port to avoid the complexity of running and routing two apps. This design folds `apps/admin` into `apps/frontend`.

## Goals

- One Nuxt app, one dev server, one port (3100).
- Public vitrine stays server-rendered (SEO, JSON-LD preserved).
- Admin panel stays client-rendered (SPA) so existing `localStorage`-based auth keeps working unchanged.
- Zero visual regression on the admin UI — no style refactor in this change.
- Clean URL namespaces: public under `/`, `/[slug]`, `/[slug]/*`; admin under `/admin/**`.

## Non-goals

- Refactor admin visual design into the "Atelier" editorial palette.
- Rewrite auth to use httpOnly cookies.
- Multi-tenant admin (one panel per slug). Admin stays global per logged-in user.

## Architecture

A single Nuxt 3 app in `apps/frontend` that serves both zones. `routeRules` in `nuxt.config.ts` toggles SSR off for the admin namespace only.

```
apps/frontend/                          (single Nuxt app, port 3100)
├── nuxt.config.ts                      (ssr: true + routeRules for /admin/**)
├── pages/
│   ├── [slug]/                         (SSR — public vitrine)
│   │   ├── index.vue
│   │   ├── reservation/
│   │   └── avis/
│   └── admin/                          (SPA — admin panel)
│       ├── login.vue                   (layout: admin-auth, no middleware)
│       ├── index.vue                   (layout: admin, middleware: admin-auth)
│       ├── reservations/{index,[id]}.vue
│       ├── agenda/index.vue
│       ├── services/index.vue
│       ├── horaires/index.vue
│       ├── avis/index.vue
│       └── parametres/index.vue
├── layouts/
│   ├── admin.vue                       (sidebar + header, links prefixed /admin/)
│   └── admin-auth.vue                  (centered login layout)
├── middleware/
│   └── admin-auth.ts                   (client-only JWT check)
├── composables/
│   ├── useAuth.ts                      (redirects to /admin/login)
│   └── useToast.ts
└── components/admin/                   (StatCard, StatusBadge, ServiceForm, ToastContainer)
```

### Nuxt config changes

```ts
export default defineNuxtConfig({
  // ... existing config preserved
  ssr: true,
  routeRules: {
    '/admin/**': { ssr: false, robots: 'noindex, nofollow' },
  },
})
```

SSR stays on globally so `/`, `/[slug]`, `/[slug]/reservation` are crawlable with proper JSON-LD. `/admin/**` is rendered client-side only, which is what the admin panel already relies on (`localStorage` for JWT).

### Routing

| Zone | URL | Mode |
|---|---|---|
| Public landing | `/` | SSR |
| Public vitrine | `/salon-emma` | SSR |
| Reservation tunnel | `/salon-emma/reservation` | SSR |
| Reviews | `/salon-emma/avis` | SSR |
| Admin login | `/admin/login` | SPA |
| Admin dashboard | `/admin` | SPA |
| Admin reservations | `/admin/reservations`, `/admin/reservations/:id` | SPA |
| Admin other | `/admin/{agenda,services,horaires,avis,parametres}` | SPA |

### Auth flow

Middleware `admin-auth.ts` applied to every page using the `admin` layout. Skipped for `/admin/login` (which uses `admin-auth` layout and no middleware).

- No token or expired token → `navigateTo('/admin/login')`
- `useAuth.login(email, password)` stores tokens in `localStorage` then redirects to `/admin`
- `useAuth.logout()` revokes server-side then redirects to `/admin/login`
- Middleware is client-only (`if (import.meta.server) return`) because the admin zone is SPA-only

### Styling

A single `tailwind.config.ts` in `apps/frontend`. The front's current config already includes the `neutral` scale (50–900) used by the admin UI (`bg-white`, `bg-neutral-50`, `text-neutral-900`, etc.), so the admin renders identically with zero changes to its existing classes.

## Data flow / backend impact

- Backend stays on port 3101, unchanged.
- `apps/backend/.env`: remove `ADMIN_URL`. CORS whitelist narrows to just `FRONTEND_URL=http://localhost:3100`.
- If the CORS whitelist in `main.ts` / `app.module.ts` references `ADMIN_URL`, drop that entry.
- `apps/backend/.env.example` updated to match.

## Migration plan (file moves)

| From | To | Notes |
|---|---|---|
| `admin/pages/login.vue` | `frontend/pages/admin/login.vue` | `definePageMeta({ layout: 'admin-auth' })` |
| `admin/pages/index.vue` | `frontend/pages/admin/index.vue` | `definePageMeta({ layout: 'admin', middleware: 'admin-auth' })` |
| `admin/pages/reservations/*` | `frontend/pages/admin/reservations/*` | same pageMeta as above |
| `admin/pages/{agenda,services,horaires,avis,parametres}/index.vue` | `frontend/pages/admin/{...}/index.vue` | same pageMeta |
| `admin/layouts/default.vue` | `frontend/layouts/admin.vue` | rename nav links `/` → `/admin`, `/reservations` → `/admin/reservations`, etc. |
| `admin/layouts/auth.vue` | `frontend/layouts/admin-auth.vue` | rename only |
| `admin/middleware/auth.ts` | `frontend/middleware/admin-auth.ts` | rename + update `navigateTo('/login')` → `navigateTo('/admin/login')` |
| `admin/composables/useAuth.ts` | `frontend/composables/useAuth.ts` | update redirects to `/admin`, `/admin/login` |
| `admin/composables/useToast.ts` | `frontend/composables/useToast.ts` | unchanged |
| `admin/components/*.vue` | `frontend/components/admin/*.vue` | auto-import becomes `<AdminStatCard>` etc; update usages in admin pages |

## Error handling

- Admin middleware wraps JWT decoding in try/catch, clears invalid token, redirects.
- `useAuth.apiFetch` on 401 → clear token + redirect `/admin/login` (existing behavior preserved).
- No server-side admin route exists, so no SSR error handling concerns for `/admin/**`.

## Testing plan

After migration, manually verify:

1. `pnpm --filter frontend dev` boots cleanly on port 3100.
2. `curl -o /dev/null -w "%{http_code}" http://localhost:3100/salon-emma` → `200` with SSR HTML containing JSON-LD.
3. `curl -o /dev/null -w "%{http_code}" http://localhost:3100/admin/login` → `200`, SPA shell.
4. Login via UI with `admin@admin.fr / adminadmin` → redirect to `/admin` → sidebar visible with dashboard stats.
5. Navigate each admin section (reservations, agenda, services, horaires, avis, parametres) — no 404, no hydration errors.
6. Logout → back on `/admin/login`.
7. Public vitrine `/salon-emma` still renders correctly with "Atelier" editorial styling.

## Cleanup

- Delete `apps/admin/` entirely after manual verification passes.
- Remove `apps/admin` from `pnpm-workspace.yaml` if listed explicitly.
- Update `CLAUDE.md` ports section and repo layout.
- Remove `ADMIN_URL` from `apps/backend/.env` and `.env.example`.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Hydration mismatch on `/admin/**` if `ssr: false` rule not applied | Verify `routeRules` is picked up by inspecting response headers (`x-nuxt-no-ssr` or empty initial HTML). |
| Admin nav links point to stale paths after merge | Global search/replace in `layouts/admin.vue` and any `<NuxtLink>` inside admin pages. |
| Auto-imported component name collisions | Admin components live in `components/admin/` → Nuxt prefixes them with `Admin*`. No collision with front components. |
| `useAuth` composable leaks into public pages | Composables are lazy-loaded on first use; public pages don't call `useAuth()`, so no runtime impact. |
| Removing `apps/admin` breaks workspace before merge is verified | Do the delete as the final step, only after all manual checks pass. |

## Out of scope (follow-ups)

- Refactor admin UI into the editorial palette.
- Move JWT to httpOnly cookies.
- Add E2E tests covering the merged routing.
