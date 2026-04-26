# 📅 Booking Pro

**Système de réservation en ligne complet pour artisans et prestataires de services français**

> Template clé-en-main pour coiffeurs, ostéopathes, masseurs, auto-écoles, esthéticiennes...
> Déployable en quelques minutes, configurable par business.

---

## 🏗️ Architecture

```
booking-pro/                         # Monorepo pnpm
│
├── apps/
│   ├── frontend/    :3000           # Site public (Nuxt 4 + Vue 3 + Tailwind)
│   │   └── /{slug}                  # Page par business: /salon-emma
│   │       ├── /                    # Accueil: hero + services + avis + horaires
│   │       ├── /reservation         # Tunnel réservation 3 étapes
│   │       └── /avis                # Formulaire avis
│   │
│   ├── admin/       :3002           # Panel admin (Nuxt 4 SPA)
│   │   ├── /login                   # Authentification
│   │   ├── /                        # Dashboard: stats + RDV imminents
│   │   ├── /reservations            # Liste + filtres
│   │   ├── /agenda                  # Vue calendrier semaine
│   │   ├── /services                # CRUD services
│   │   ├── /horaires                # Disponibilités + blocages
│   │   ├── /avis                    # Modération avis
│   │   └── /parametres              # Config business
│   │
│   └── backend/     :3001           # API REST (NestJS + TypeScript)
│       ├── /auth                    # JWT auth
│       ├── /businesses              # Infos + stats
│       ├── /services                # Gestion services
│       ├── /bookings                # 🔑 Réservations + créneaux
│       ├── /reviews                 # Avis
│       ├── /availability            # Horaires + blocages
│       ├── /health                  # Health check
│       └── /api/docs                # Swagger
│
├── packages/
│   ├── prisma/                      # Schema PostgreSQL + migrations + seed
│   └── shared/                      # Types TypeScript partagés
│
├── docker-compose.yml               # Dev local complet (DB + Mail)
└── .env.example                     # Variables d'environnement

```

---

## ⚡ Démarrage rapide (Dev)

### Prérequis
- Node.js ≥ 20
- pnpm ≥ 9 (`npm i -g pnpm`)
- Docker + Docker Compose

### 1. Installation
```bash
git clone https://github.com/nicolasMaillard49/booking-pro
cd booking-pro

# Copier et configurer les variables d'environnement
cp .env.example apps/backend/.env

# Installer toutes les dépendances (workspaces)
pnpm install
```

### 2. Lancer la base de données (Docker)
```bash
# PostgreSQL + MailHog (serveur mail de dev)
docker-compose up postgres mailhog -d

# Attendre que PostgreSQL soit prêt, puis:
cd packages/prisma
DATABASE_URL="postgresql://booking:booking123@localhost:5432/booking_pro" npx prisma migrate dev --name init
DATABASE_URL="postgresql://booking:booking123@localhost:5432/booking_pro" npx prisma db seed
```

### 3. Lancer les applications
```bash
# Terminal 1: Backend NestJS
cd apps/backend
pnpm dev
# → http://localhost:3101
# → Swagger: http://localhost:3101/api/docs

# Terminal 2: Frontend (public + admin)
cd apps/frontend
pnpm dev
# → http://localhost:3100/salon-emma          (zone publique)
# → http://localhost:3100/admin/login         (panel admin)
```

### 4. Accès par défaut (seed)
| URL | Credentials |
|-----|-------------|
| http://localhost:3100/salon-emma | — |
| http://localhost:3100/admin/login | admin@salon-emma.fr / Admin1234! |
| http://localhost:3101/api/docs (Swagger) | — |
| http://localhost:8025 (MailHog) | — |

---

## 🐳 Docker Compose complet

```bash
# Lancer TOUT en une commande
docker-compose up -d

# Appliquer les migrations
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed

# Logs
docker-compose logs -f backend
```

---

## 🔑 Variables d'environnement

Créer `apps/backend/.env` depuis `.env.example`:

```env
# Base de données
DATABASE_URL="postgresql://booking:booking123@localhost:5432/booking_pro"

# JWT (changer en production !)
JWT_SECRET="votre-secret-tres-long-et-aleatoire"
JWT_REFRESH_SECRET="autre-secret-pour-refresh"

# CORS: domaine autorisé (public + /admin partagent la même origine)
FRONTEND_URL="https://votre-domaine.fr"

# Email (Nodemailer)
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USER="postmaster@mg.votre-domaine.fr"
SMTP_PASS="votre-clé-smtp"
EMAIL_FROM="Booking Pro <noreply@votre-domaine.fr>"
```

---

## 📡 API Reference

### Publiques (sans auth)
```
GET  /businesses/:slug               → Infos du business
GET  /businesses/:slug/services      → Services actifs
GET  /businesses/:slug/availability  → Créneaux disponibles (?date=YYYY-MM-DD&duration=60)
GET  /businesses/:slug/schedule      → Horaires de la semaine
GET  /businesses/:slug/reviews       → Avis approuvés
POST /bookings                       → Créer une réservation
POST /reviews                        → Soumettre un avis
GET  /bookings/:cancelToken/cancel   → Annuler (lien email)
GET  /bookings/:confirmToken/confirm → Confirmer (lien email)
GET  /health                         → Health check
```

### Admin (Bearer token requis)
```
POST   /auth/login                   → Connexion
POST   /auth/refresh                 → Renouveler le token
POST   /auth/logout                  → Déconnexion

GET    /bookings                     → Liste paginée (?page=1&status=PENDING&date=today)
GET    /bookings/:id                 → Détail
PATCH  /bookings/:id                 → Modifier statut + notes
DELETE /bookings/:id                 → Supprimer

POST   /services                     → Créer service
PATCH  /services/:id                 → Modifier
DELETE /services/:id                 → Désactiver
PATCH  /services/reorder             → Réordonner

PUT    /availability                 → Mettre à jour horaires
POST   /availability/block           → Bloquer un créneau
DELETE /availability/block/:id       → Débloquer
GET    /availability/blocks          → Liste blocages

GET    /admin/reviews                → Tous les avis
PATCH  /reviews/:id                  → Approuver/rejeter

PATCH  /businesses/:id               → Modifier infos
GET    /businesses/:id/stats         → Stats dashboard
```

---

## 🧠 Logique créneaux disponibles

La fonction centrale (`BookingsService.generateSlots()`):

```
1. Vérifie que le jour est actif (Availability.isActive)
2. Récupère les réservations du jour (status: PENDING | CONFIRMED)
3. Récupère les créneaux bloqués (BlockedSlot)
4. Génère des slots de 30 min de l'ouverture à la fermeture
5. Pour chaque slot: vérifie qu'il ne chevauche pas une plage occupée
   → Un chevauchement existe si: slotStart < occupiedEnd && slotEnd > occupiedStart
6. Filtre les créneaux passés (si aujourd'hui: +30min buffer)
7. Retourne la liste avec available: true/false
```

**Double-check côté serveur** lors de la création: même logique réappliquée pour éviter les race conditions (deux utilisateurs qui réservent le même créneau simultanément).

---

## 🚀 Déploiement en production

### Option 1: VPS (Hetzner, OVH, etc.)

```bash
# Sur le serveur
docker-compose -f docker-compose.yml up -d

# Variables d'environnement: utiliser un fichier .env hors du repo
# ou des secrets Docker/Portainer
```

### Option 2: Railway / Render
1. Créer 2 services (backend, frontend — l'admin est une zone du frontend)
2. Ajouter PostgreSQL comme database service
3. Configurer les variables d'environnement
4. Déployer depuis GitHub

### Checklist production
- [ ] Changer `JWT_SECRET` et `JWT_REFRESH_SECRET` (secrets longs et aléatoires)
- [ ] Configurer `FRONTEND_URL` sur le vrai domaine
- [ ] Configurer SMTP avec un vrai provider (Mailgun, SendGrid, Brevo)
- [ ] Mettre `NODE_ENV=production`
- [ ] Configurer HTTPS (Traefik ou Nginx + Certbot)
- [ ] Activer les backups automatiques PostgreSQL
- [ ] Surveiller les logs (Loki, Datadog, Sentry)

---

## 🔧 Ajouter un nouveau business

```bash
# 1. Créer le business en DB (via seed ou SQL direct)
# 2. Créer l'utilisateur admin
# 3. Configurer les horaires dans le panel admin
# 4. Créer les services
# 5. Le site est accessible sur: /{slug}
```

Via l'API:
```bash
# Créer un business (directement via SQL pour l'instant)
# TODO: endpoint POST /businesses (super-admin)
```

---

## 📁 Structure fichiers importants

```
apps/backend/src/
├── main.ts                    # Bootstrap NestJS
├── app.module.ts              # Module racine
├── prisma/                    # Service Prisma (connecteur DB)
├── common/
│   ├── filters/               # Exception filter (format d'erreur uniforme)
│   ├── guards/                # JWT guard
│   └── decorators/            # @Public(), @CurrentUser()
└── modules/
    ├── auth/                  # Login, refresh, JWT strategy
    ├── business/              # Infos + stats
    ├── services/              # CRUD services
    ├── bookings/              # 🔑 Réservations + algorithme créneaux
    ├── reviews/               # Avis + modération
    ├── availability/          # Horaires + blocages
    └── notifications/         # Emails Nodemailer

apps/frontend/
├── pages/
│   ├── [slug]/                # Zone publique (dynamic route, SSR)
│   │   ├── index.vue          # Accueil avec SEO + JSON-LD
│   │   ├── reservation/       # Tunnel réservation
│   │   └── avis/              # Formulaire avis
│   └── admin/                 # Zone admin (SPA, noindex via routeRules)
│       ├── login.vue          # Connexion
│       ├── index.vue          # Dashboard
│       ├── reservations/      # Liste + détail
│       ├── services/          # CRUD prestations
│       ├── horaires.vue
│       ├── avis.vue
│       └── parametres.vue
├── layouts/
│   ├── admin.vue              # Sidebar + wrapper admin
│   └── admin-auth.vue         # Layout minimal pour /admin/login
├── middleware/
│   └── admin-auth.ts          # Garde JWT côté client
├── composables/
│   ├── useAuth.ts             # Auth + apiFetch authentifié
│   └── useToast.ts
└── components/
    ├── ServiceCard.vue        # Card prestation
    ├── SlotPicker.vue         # Calendrier + créneaux
    ├── HorairesWidget.vue     # Badge ouvert/fermé
    ├── ReviewsSection.vue     # Grille d'avis
    ├── StickyBookButton.vue   # Bouton mobile sticky
    └── admin/                 # Composants de la zone admin
        ├── AdminStatusBadge.vue
        ├── AdminStatCard.vue
        └── AdminServiceForm.vue
```

---

## 🛠️ Stack technique

| Layer | Technologie | Version |
|-------|-------------|---------|
| Backend | NestJS | 10 |
| ORM | Prisma | 5 |
| Base de données | PostgreSQL | 16 |
| Frontend | Nuxt | 3.12 |
| Framework UI | Vue | 3.4 |
| CSS | Tailwind CSS | 3.4 |
| Auth | JWT + Bcrypt | — |
| Email | Nodemailer | 6 |
| API docs | Swagger/OpenAPI | — |
| Typage | TypeScript strict | 5.4 |
| Containerisation | Docker | — |
| Package manager | pnpm workspaces | 9 |

---

## 📄 Licence

MIT — Libre d'utilisation commerciale, modification et distribution.

---

*Booking Pro — Fait avec ❤️ pour les artisans et prestataires français*
