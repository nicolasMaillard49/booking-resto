# Merge Admin Into Frontend — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fold `apps/admin` into `apps/frontend` so both zones run as a single Nuxt app on port 3100 — public vitrine under `/[slug]` (SSR) and admin panel under `/admin/**` (SPA).

**Architecture:** One Nuxt 3 app. `routeRules` in `nuxt.config.ts` disables SSR on `/admin/**` only. Admin pages use a dedicated layout (`admin.vue`) and client-only middleware (`admin-auth.ts`) for JWT gating. No visual refactor of admin UI. Backend stays on port 3101 with CORS whitelist narrowed to just `FRONTEND_URL`.

**Tech Stack:** Nuxt 3.12, Vue 3, Tailwind CSS, TypeScript, pnpm workspaces.

**Design doc:** `docs/plans/2026-04-11-merge-admin-into-frontend-design.md`

---

## Pre-flight

- Ensure working tree is clean: `git status`
- Ensure dev servers are stopped before editing files (avoid HMR chaos on file moves).
- Reference file paths in this plan are absolute-ish (from repo root).

---

## Task 1: Add `routeRules` to frontend `nuxt.config.ts`

**Files:**
- Modify: `apps/frontend/nuxt.config.ts`

**Step 1: Edit the config**

Add a `routeRules` block right after the `ssr: true` line:

```ts
// SSR activé pour le SEO
ssr: true,

// Admin zone: SPA uniquement, pas d'indexation
routeRules: {
  '/admin/**': { ssr: false, robots: 'noindex, nofollow' },
},
```

**Step 2: Verify file parses**

Run: `pnpm --filter frontend exec nuxi prepare`
Expected: command exits 0, no parse errors printed.

**Step 3: Commit**

```bash
git add apps/frontend/nuxt.config.ts
git commit -m "feat(frontend): add routeRules to disable SSR on /admin/**"
```

---

## Task 2: Copy composables from admin to frontend

**Files:**
- Create: `apps/frontend/composables/useAuth.ts`
- Create: `apps/frontend/composables/useToast.ts`

**Step 1: Copy `useAuth.ts` content**

Read `apps/admin/composables/useAuth.ts` and write the identical content to `apps/frontend/composables/useAuth.ts`, with TWO changes:
- `await navigateTo('/login')` in `logout()` → `await navigateTo('/admin/login')`
- (No other changes — the `login()` method does NOT navigate; redirect after login is handled by the page itself.)

**Step 2: Copy `useToast.ts` content verbatim**

Read `apps/admin/composables/useToast.ts` and write the identical content to `apps/frontend/composables/useToast.ts`.

**Step 3: Commit**

```bash
git add apps/frontend/composables/useAuth.ts apps/frontend/composables/useToast.ts
git commit -m "feat(frontend): copy admin composables (useAuth, useToast)"
```

---

## Task 3: Create admin middleware in frontend

**Files:**
- Create: `apps/frontend/middleware/admin-auth.ts`

**Step 1: Write the middleware**

```ts
// ── Middleware d'authentification admin ───────────────────────
// Protège les routes /admin/** sauf /admin/login
// Client-only : la zone admin est rendue en SPA (routeRules)

export default defineNuxtRouteMiddleware((to) => {
  // Login page is public
  if (to.path === '/admin/login') return

  // SPA zone — server-side check is a no-op
  if (import.meta.server) return

  const token = localStorage.getItem('access_token')
  if (!token) {
    return navigateTo('/admin/login')
  }

  // Check JWT expiration (simple base64 decode)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      return navigateTo('/admin/login')
    }
  } catch {
    localStorage.removeItem('access_token')
    return navigateTo('/admin/login')
  }
})
```

**Step 2: Commit**

```bash
git add apps/frontend/middleware/admin-auth.ts
git commit -m "feat(frontend): add admin-auth middleware for /admin/** routes"
```

---

## Task 4: Create admin layouts in frontend

**Files:**
- Create: `apps/frontend/layouts/admin.vue`
- Create: `apps/frontend/layouts/admin-auth.vue`

**Step 1: Write `admin-auth.vue`** (minimal centered layout for login)

```vue
<template>
  <div class="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
    <slot />
  </div>
</template>
```

**Step 2: Write `admin.vue`** (sidebar + content layout)

Base the content on `apps/admin/layouts/default.vue` with these changes:
- **Remove** the `definePageMeta({ middleware: 'auth' })` line — middleware is set per page now.
- **Update `navItems`** to prefix every path with `/admin`:

```ts
const navItems = [
  { path: '/admin', icon: '📊', label: 'Dashboard' },
  { path: '/admin/reservations', icon: '📅', label: 'Réservations' },
  { path: '/admin/agenda', icon: '🗓️', label: 'Agenda' },
  { path: '/admin/services', icon: '✂️', label: 'Services' },
  { path: '/admin/horaires', icon: '🕐', label: 'Horaires' },
  { path: '/admin/avis', icon: '⭐', label: 'Avis' },
  { path: '/admin/parametres', icon: '⚙️', label: 'Paramètres' },
]
```

- **Update `isActive`** to handle the `/admin` root correctly:

```ts
function isActive(path: string): boolean {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}
```

- Keep everything else identical (template, styles, logout button, `<aside>` sidebar).

**Step 3: Commit**

```bash
git add apps/frontend/layouts/admin.vue apps/frontend/layouts/admin-auth.vue
git commit -m "feat(frontend): add admin and admin-auth layouts"
```

---

## Task 5: Copy admin components under `components/admin/`

**Files:**
- Create: `apps/frontend/components/admin/StatCard.vue`
- Create: `apps/frontend/components/admin/StatusBadge.vue`
- Create: `apps/frontend/components/admin/ServiceForm.vue`
- Create: `apps/frontend/components/admin/ToastContainer.vue`

**Step 1: Copy all four files verbatim**

For each file in `apps/admin/components/`, copy its contents to `apps/frontend/components/admin/<same-filename>.vue` with no modifications.

> Nuxt auto-imports components from `components/admin/*.vue` as `<AdminStatCard>`, `<AdminStatusBadge>`, `<AdminServiceForm>`, `<AdminToastContainer>` (directory name prefix). Usages in the admin pages will be updated in Task 6.

**Step 2: Commit**

```bash
git add apps/frontend/components/admin/
git commit -m "feat(frontend): copy admin components under components/admin/"
```

---

## Task 6: Copy `admin/pages/login.vue` → `frontend/pages/admin/login.vue`

**Files:**
- Create: `apps/frontend/pages/admin/login.vue`

**Step 1: Copy with three edits**

Read `apps/admin/pages/login.vue`. Write to new path with these changes:
- `definePageMeta({ layout: 'auth' })` → `definePageMeta({ layout: 'admin-auth' })`
- `await navigateTo('/')` → `await navigateTo('/admin')`
- No other edits (template and form logic unchanged).

**Step 2: Commit**

```bash
git add apps/frontend/pages/admin/login.vue
git commit -m "feat(frontend): add admin login page under /admin/login"
```

---

## Task 7: Copy `admin/pages/index.vue` → `frontend/pages/admin/index.vue`

**Files:**
- Create: `apps/frontend/pages/admin/index.vue`

**Step 1: Copy with edits**

Read `apps/admin/pages/index.vue`. Write to new path with these changes:
- `definePageMeta({ middleware: 'auth' })` → `definePageMeta({ layout: 'admin', middleware: 'admin-auth' })`
- `<StatCard>` → `<AdminStatCard>` (keep all props)
- `<StatusBadge>` → `<AdminStatusBadge>` (keep all props)
- `<NuxtLink to="/reservations">` → `<NuxtLink to="/admin/reservations">`

**Step 2: Commit**

```bash
git add apps/frontend/pages/admin/index.vue
git commit -m "feat(frontend): add admin dashboard at /admin"
```

---

## Task 8: Copy `admin/pages/reservations/` → `frontend/pages/admin/reservations/`

**Files:**
- Create: `apps/frontend/pages/admin/reservations/index.vue`
- Create: `apps/frontend/pages/admin/reservations/[id].vue`

**Step 1: Copy `index.vue`**

Read `apps/admin/pages/reservations/index.vue`. Write to new path with these changes:
- `definePageMeta({ middleware: 'auth' })` → `definePageMeta({ layout: 'admin', middleware: 'admin-auth' })`
- Any `<StatCard>` → `<AdminStatCard>`, `<StatusBadge>` → `<AdminStatusBadge>`, `<ServiceForm>` → `<AdminServiceForm>`, `<ToastContainer>` → `<AdminToastContainer>` (for components that actually appear in this file only).
- Any internal link `to="/reservations/..."` → `to="/admin/reservations/..."`, `to="/"` → `to="/admin"`, etc.

**Step 2: Copy `[id].vue`**

Apply the same transformations.

**Step 3: Commit**

```bash
git add apps/frontend/pages/admin/reservations/
git commit -m "feat(frontend): add admin reservations pages at /admin/reservations"
```

---

## Task 9: Copy remaining admin pages (agenda, services, horaires, avis, parametres)

**Files:**
- Create: `apps/frontend/pages/admin/agenda/index.vue`
- Create: `apps/frontend/pages/admin/services/index.vue`
- Create: `apps/frontend/pages/admin/horaires/index.vue`
- Create: `apps/frontend/pages/admin/avis/index.vue`
- Create: `apps/frontend/pages/admin/parametres/index.vue`

**Step 1: For each page, copy with the same transformation pattern**

For every page, apply these edits:
- `definePageMeta({ middleware: 'auth' })` → `definePageMeta({ layout: 'admin', middleware: 'admin-auth' })`
- Any `<StatCard>` → `<AdminStatCard>`, `<StatusBadge>` → `<AdminStatusBadge>`, `<ServiceForm>` → `<AdminServiceForm>`, `<ToastContainer>` → `<AdminToastContainer>` if present
- Any `<NuxtLink to="/...">` pointing to admin routes gets prefixed with `/admin`
- Any programmatic `navigateTo('/...')` pointing to admin routes gets prefixed with `/admin`

**Step 2: Commit**

```bash
git add apps/frontend/pages/admin/
git commit -m "feat(frontend): add remaining admin pages (agenda, services, horaires, avis, parametres)"
```

---

## Task 10: Update backend CORS to drop `ADMIN_URL`

**Files:**
- Modify: `apps/backend/src/main.ts`
- Modify: `apps/backend/.env`
- Modify: `.env.example`

**Step 1: Edit `apps/backend/src/main.ts`**

Replace lines 22–29 (the frontendUrl / adminUrl / enableCors block) with:

```ts
const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3100');
app.enableCors({
  origin: [frontendUrl],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**Step 2: Edit `apps/backend/.env`**

Remove the line `ADMIN_URL="http://localhost:3102"`.

**Step 3: Edit `.env.example`**

Remove the line `ADMIN_URL="http://localhost:3002"`.

**Step 4: Commit**

```bash
git add apps/backend/src/main.ts apps/backend/.env .env.example
git commit -m "refactor(backend): drop ADMIN_URL from CORS — admin is now part of frontend"
```

> Note: `apps/backend/.env` is gitignored in most projects. If `git status` shows it as untracked, skip staging it but still edit it locally. Check with `git check-ignore apps/backend/.env`.

---

## Task 11: Manual smoke test — public zone

**Step 1: Start backend**

In terminal A: `pnpm --filter backend start:dev`
Expected: "🚀 Backend démarré sur http://localhost:3101"

**Step 2: Start frontend**

In terminal B: `pnpm --filter frontend dev`
Expected: Nuxt boots on port 3100, no compilation errors.

**Step 3: Check public homepage**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3100/salon-emma`
Expected: `200`

Run: `curl -s http://localhost:3100/salon-emma | grep -o 'application/ld+json'`
Expected: at least one match (SSR is still producing JSON-LD).

**Step 4: Check reservation page**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3100/salon-emma/reservation`
Expected: `200`

---

## Task 12: Manual smoke test — admin zone

**Step 1: Check `/admin/login` responds**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3100/admin/login`
Expected: `200`

Run: `curl -s http://localhost:3100/admin/login | grep -c 'noindex'`
Expected: at least `1` (robots meta injected by routeRules).

**Step 2: Verify /admin/login is SPA-rendered**

Run: `curl -s http://localhost:3100/admin/login | grep -c 'Connexion Admin'`
Expected: `0` (the login text is not in the SSR HTML because routeRules disables SSR).

**Step 3: Test login flow in browser**

1. Open http://localhost:3100/admin/login in a browser.
2. Login with `admin@admin.fr` / `adminadmin`.
3. Verify redirect to `/admin` and sidebar appears with all 7 nav items.
4. Click each nav item and verify no 404.
5. Click "Déconnexion" — verify redirect to `/admin/login`.

**Step 4: Verify middleware blocks unauthorized access**

1. In the browser, open DevTools → Application → Local Storage and remove `access_token`.
2. Navigate to http://localhost:3100/admin/reservations.
3. Expected: redirected to `/admin/login`.

---

## Task 13: Delete `apps/admin` and update workspace

**Only proceed if Task 11 and Task 12 both pass completely.**

**Files:**
- Delete: `apps/admin/` (entire directory)

**Step 1: Stop dev servers**

Kill the frontend and backend processes (Ctrl+C in their terminals).

**Step 2: Delete the directory**

Run: `rm -rf apps/admin`

**Step 3: Verify workspace still resolves**

Run: `pnpm install`
Expected: resolves without errors. `pnpm-workspace.yaml` uses `apps/*` glob so no explicit entry to remove.

**Step 4: Re-run frontend dev**

Run: `pnpm --filter frontend dev`
Expected: still boots on 3100, no references to deleted files.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove apps/admin — merged into frontend"
```

---

## Task 14: Update `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update the repo layout section**

Find any reference to `apps/admin` and remove/update:
- Replace "three apps (backend, frontend, admin)" wording with "two apps (backend, frontend)".
- In the ports table/list, remove the admin entry (3102 or 3002).
- Add a note: "The admin panel lives at `/admin/**` inside `apps/frontend`, rendered as SPA via `routeRules` (SSR disabled on that path)."

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md — admin merged into frontend, single port 3100"
```

---

## Task 15: Final verification pass

**Step 1: Clean rebuild**

Run:
```bash
pnpm --filter frontend exec nuxi cleanup
pnpm --filter frontend exec nuxi prepare
```
Expected: no errors.

**Step 2: Type check**

Run: `pnpm --filter frontend type-check`
Expected: 0 errors.

**Step 3: Full smoke test**

Restart backend + frontend. Hit:
- `http://localhost:3100/` → 200 (or appropriate landing)
- `http://localhost:3100/salon-emma` → 200, SSR HTML with JSON-LD
- `http://localhost:3100/admin/login` → 200, SPA shell, `noindex` meta
- Login → dashboard → navigate all admin sections → logout. All work.

**Step 4: Commit if needed**

If any final fixes were needed, commit them with a descriptive message.

---

## Done criteria

- [ ] Only one Nuxt dev server runs (port 3100)
- [ ] `apps/admin` no longer exists
- [ ] Public pages still SSR with JSON-LD
- [ ] Admin pages work under `/admin/**`, protected by middleware, logout works
- [ ] Backend CORS whitelist no longer mentions `ADMIN_URL`
- [ ] `CLAUDE.md` reflects the new single-app structure
- [ ] `git status` is clean
