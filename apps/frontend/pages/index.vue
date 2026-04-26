<script setup lang="ts">
import type { ServicePublic, ReviewPublic, DaySchedule } from '@booking-resto/shared'
import { siteConfig } from '@booking-resto/shared'

const config = useRuntimeConfig()
const baseUrl = config.public.apiUrl
const siteUrl = config.public.siteUrl

// ── Données parallèles ────────────────────────────────────
const [{ data: services }, { data: reviews }, { data: schedule }] = await Promise.all([
  useAsyncData('services', () =>
    $fetch<ServicePublic[]>(`${baseUrl}/public/services`).catch(() => [])
  ),
  useAsyncData('reviews', () =>
    $fetch<ReviewPublic[]>(`${baseUrl}/public/reviews`).catch(() => [])
  ),
  useAsyncData('schedule', () =>
    $fetch<DaySchedule[]>(`${baseUrl}/public/schedule`).catch(() => [])
  ),
])

// ── SEO ───────────────────────────────────────────────────
useSeoMeta({
  title: `${siteConfig.name} — Réservation en ligne à ${siteConfig.contact.city}`,
  description: siteConfig.description,
  ogTitle: `${siteConfig.name} — Réservez en ligne`,
  ogDescription: siteConfig.description,
  ogUrl: siteUrl,
  twitterCard: 'summary_large_image',
})

// ── JSON-LD LocalBusiness ─────────────────────────────────
const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const openingHours = (schedule.value ?? [])
  .filter((d) => d.isActive)
  .map((d) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: `https://schema.org/${DAYS_EN[d.dayOfWeek]}`,
    opens: d.startTime,
    closes: d.endTime,
  }))

useHead({
  link: [{ rel: 'canonical', href: siteUrl }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: siteConfig.name,
      description: siteConfig.description,
      url: siteUrl,
      telephone: siteConfig.contact.phone,
      email: siteConfig.contact.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: siteConfig.contact.address,
        addressLocality: siteConfig.contact.city,
        postalCode: siteConfig.contact.postalCode,
        addressCountry: 'FR',
      },
      openingHoursSpecification: openingHours,
      priceRange: '€€',
    }),
  }],
})

// ── Stats & état ──────────────────────────────────────────
const avgRating = computed(() => {
  if (!reviews.value?.length) return 0
  const sum = reviews.value.reduce((acc, r) => acc + r.rating, 0)
  return Math.round((sum / reviews.value.length) * 10) / 10
})

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
const now = new Date()
const todayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1
const todayName = JOURS[todayIndex]

// Map dayOfWeek (0..6, lundi=0) → { startTime, endTime, isActive }
const scheduleByDay = computed(() => {
  const map: Record<number, DaySchedule> = {}
  for (const d of schedule.value ?? []) {
    map[d.dayOfWeek] = d
  }
  return map
})

function hoursLabel(dayIndex: number): string {
  const day = scheduleByDay.value[dayIndex]
  if (!day || !day.isActive) return 'Fermé'
  return `${day.startTime} – ${day.endTime}`
}

const isOpenNow = computed(() => {
  const day = scheduleByDay.value[todayIndex]
  if (!day || !day.isActive) return false
  const toMin = (s: string) => {
    const [h, m] = s.split(':').map(Number)
    return h * 60 + (m || 0)
  }
  const current = now.getHours() * 60 + now.getMinutes()
  return current >= toMin(day.startTime) && current < toMin(day.endTime)
})

// ── Références typographiques ───────────────────────────
const year = new Date().getFullYear()
const estYear = siteConfig.foundedYear
const pad = (n: number) => String(n).padStart(2, '0')

// ── Navigation ────────────────────────────────────────────
function goToBooking() {
  navigateTo('/reservation')
}
</script>

<template>
  <div class="min-h-screen bg-paper text-ink selection:bg-ink selection:text-canvas overflow-x-clip">

    <!-- ═══════════════════ NAV ═══════════════════ -->
    <header class="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b-2 border-ink">
      <div class="max-w-[1400px] mx-auto px-5 sm:px-10 h-16 flex items-center justify-between gap-6">
        <div class="flex items-center gap-4 min-w-0">
          <span class="label-meta hidden sm:inline">Est. {{ estYear }}</span>
          <span class="hidden sm:block h-4 w-px bg-ink/30" />
          <span class="inline-flex items-center gap-2 font-display text-[19px] font-medium tracking-tight truncate">
            <span class="h-1.5 w-1.5 rounded-full bg-primary-500" />
            {{ siteConfig.name }}
          </span>
        </div>

        <nav class="hidden md:flex items-center gap-8 label-meta">
          <a href="#prestations" class="link-editorial text-ink">Prestations</a>
          <a href="#horaires" class="link-editorial text-ink">Horaires</a>
          <a href="#avis" class="link-editorial text-ink">Avis</a>
          <a href="#contact" class="link-editorial text-ink">Contact</a>
        </nav>

        <button
          @click="goToBooking"
          class="group relative inline-flex items-center gap-2 bg-ink text-canvas px-5 py-2.5 text-sm font-medium tracking-tight border-2 border-ink hover:bg-primary-600 hover:border-primary-600 transition-colors"
        >
          Prendre rendez-vous
          <span class="transition-transform group-hover:translate-x-0.5">→</span>
        </button>
      </div>
    </header>

    <!-- ═══════════════════ STATUS TICKER ═══════════════════ -->
    <div class="bg-ink text-canvas/80 border-b-2 border-ink overflow-hidden">
      <div class="flex items-center gap-8 py-2 label-meta text-canvas/60 whitespace-nowrap ticker-track">
        <template v-for="n in 2" :key="n">
          <span class="flex items-center gap-2">
            <span :class="['h-1.5 w-1.5 rounded-full', isOpenNow ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400']" />
            {{ isOpenNow ? 'Ouvert maintenant' : 'Actuellement fermé' }}
          </span>
          <span class="opacity-40">◆</span>
          <span>{{ siteConfig.contact.city }}, France</span>
          <span class="opacity-40">◆</span>
          <span>Réservation 24/7</span>
          <span class="opacity-40">◆</span>
          <span>Confirmation instantanée</span>
          <span class="opacity-40">◆</span>
          <span>Annulation libre</span>
          <span class="opacity-40">◆</span>
          <span>{{ year }} / Nº {{ pad(todayIndex + 1) }}</span>
          <span class="opacity-40">◆</span>
        </template>
      </div>
    </div>

    <!-- ═══════════════════ HERO ═══════════════════ -->
    <section class="relative border-b-2 border-ink overflow-hidden">
      <div class="absolute -right-8 -bottom-16 sm:-right-16 sm:-bottom-24 decor-numeral text-primary-500/10 pointer-events-none" aria-hidden="true">
        01
      </div>

      <div class="relative max-w-[1400px] mx-auto px-5 sm:px-10 pt-16 sm:pt-24 pb-20 sm:pb-32">

        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 mb-10 reveal" style="animation-delay: 0ms">
          <span class="label-meta">Nº {{ pad(estYear % 100) }} / Édition {{ year }}</span>
          <span class="h-px w-8 bg-ink/40" />
          <span class="label-meta capitalize">{{ siteConfig.type }}</span>
          <span class="h-px w-8 bg-ink/40" />
          <span class="label-meta">{{ siteConfig.contact.city }}, {{ siteConfig.contact.postalCode }}</span>
          <span class="h-px w-8 bg-ink/40" />
          <span class="label-meta inline-flex items-center gap-1.5">
            <span class="h-1.5 w-1.5 rounded-full bg-primary-500" />
            Maison indépendante
          </span>
        </div>

        <div class="grid lg:grid-cols-12 gap-10 lg:gap-16 items-end">
          <div class="lg:col-span-8 reveal" style="animation-delay: 120ms">
            <h1 class="display-xxl">
              <span class="italic font-light">{{ siteConfig.name.split(' ')[0] }}</span>
              <template v-if="siteConfig.name.split(' ').length > 1">
                <br />
                <span class="font-medium">
                  {{ siteConfig.name.split(' ').slice(1).join(' ') }}<span class="text-primary-500">.</span>
                </span>
              </template>
              <span v-else class="text-primary-500">.</span>
            </h1>
          </div>

          <aside class="lg:col-span-4 space-y-8 reveal" style="animation-delay: 240ms">
            <div class="border-l-2 border-primary-500 pl-5">
              <div class="label-meta mb-2">Adresse</div>
              <div class="text-ink leading-snug">
                {{ siteConfig.contact.address }}<br />
                {{ siteConfig.contact.postalCode }} {{ siteConfig.contact.city }}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-6">
              <div>
                <div class="label-meta mb-2">Téléphone</div>
                <a :href="`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`" class="link-editorial text-ink">{{ siteConfig.contact.phone }}</a>
              </div>
              <div>
                <div class="label-meta mb-2">Email</div>
                <a :href="`mailto:${siteConfig.contact.email}`" class="link-editorial text-ink break-all text-sm">{{ siteConfig.contact.email }}</a>
              </div>
            </div>
          </aside>
        </div>

        <div class="mt-16 sm:mt-24 grid lg:grid-cols-12 gap-10 items-end border-t-2 border-ink pt-10 reveal" style="animation-delay: 360ms">
          <p class="lg:col-span-7 font-display text-2xl sm:text-3xl leading-tight italic text-ink/80 max-w-2xl">
            « Prenez rendez-vous en ligne —<br />
            disponibilités en temps réel,<br />
            confirmation immédiate. »
          </p>

          <div class="lg:col-span-5 flex flex-col items-start lg:items-end gap-4">
            <button
              @click="goToBooking"
              class="group relative inline-flex items-center gap-3 bg-ink text-canvas px-7 sm:px-10 py-5 text-base sm:text-lg font-medium tracking-tight border-2 border-ink shadow-paper hover:bg-primary-600 hover:border-primary-600 transition-colors"
            >
              <span class="font-mono text-[10px] tracking-[0.2em] uppercase opacity-60">→</span>
              Réserver maintenant
              <span class="transition-transform group-hover:translate-x-1">→</span>
            </button>

            <div class="flex items-center gap-3 label-meta">
              <div v-if="reviews?.length" class="flex items-center gap-1.5">
                <div class="flex -space-x-px">
                  <svg v-for="i in 5" :key="i" width="14" height="14" viewBox="0 0 24 24" :fill="i <= Math.round(avgRating) ? '#C34A2C' : 'none'" stroke="#1B1A17" stroke-width="1.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <span class="text-ink">{{ avgRating }}/5</span>
                <span>· {{ reviews.length }} avis</span>
              </div>
              <span v-else>Gratuit · Annulation libre</span>
            </div>
          </div>
        </div>

      </div>

      <div class="absolute right-5 sm:right-10 top-10 label-meta z-10">
        Nº 01 / 05
      </div>

      <div class="h-3 stripe-ink opacity-80" aria-hidden="true" />
    </section>

    <!-- ═══════════════════ ABOUT (INVERTED) ═══════════════════ -->
    <section v-if="siteConfig.description" class="relative bg-ink text-canvas grain-light border-b-2 border-ink overflow-hidden">
      <div class="absolute -left-6 sm:-left-16 -bottom-8 font-display italic font-light text-canvas/5 text-[24rem] sm:text-[34rem] leading-none pointer-events-none select-none" aria-hidden="true">
        &
      </div>

      <div class="relative max-w-[1400px] mx-auto px-5 sm:px-10 py-24 sm:py-32 grid lg:grid-cols-12 gap-10">
        <div class="lg:col-span-4">
          <div class="label-meta text-primary-500 mb-4">§ 02 — Présentation</div>
          <h2 class="font-display text-4xl sm:text-5xl leading-[0.92] font-medium">
            À propos<br />
            <span class="italic font-light">de la maison<span class="text-primary-500">.</span></span>
          </h2>

          <div class="mt-10 pt-8 border-t border-canvas/20 space-y-6">
            <div>
              <div class="label-meta text-canvas/50 mb-1">Fondée en</div>
              <div class="font-display text-3xl font-medium tabular-nums">{{ estYear }}</div>
            </div>
            <div>
              <div class="label-meta text-canvas/50 mb-1">Localisation</div>
              <div class="font-display text-xl">{{ siteConfig.contact.city }}, France</div>
            </div>
          </div>
        </div>
        <div class="lg:col-span-7 lg:col-start-6">
          <p class="font-display text-xl sm:text-2xl leading-[1.5] text-canvas/90 whitespace-pre-line first-letter:font-display first-letter:text-8xl first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-none first-letter:font-medium first-letter:italic first-letter:text-primary-500">{{ siteConfig.description }}</p>
        </div>
      </div>
    </section>

    <!-- ═══════════════════ SERVICES ═══════════════════ -->
    <section id="prestations" class="relative bg-canvas border-b-2 border-ink">
      <div class="max-w-[1400px] mx-auto px-5 sm:px-10 py-20 sm:py-28">

        <div class="flex items-end justify-between mb-14 flex-wrap gap-6">
          <div>
            <div class="label-meta mb-4">§ 03 — Prestations</div>
            <h2 class="font-display text-4xl sm:text-6xl leading-[0.92] font-medium">
              Le catalogue<br />
              <span class="italic font-light">complet<span class="text-primary-500">.</span></span>
            </h2>
          </div>
          <div class="label-meta max-w-[18rem] border-l-2 border-primary-500 pl-4 py-1">
            Tarifs et durées indicatifs. Cliquez sur une prestation pour démarrer la réservation.
          </div>
        </div>

        <div v-if="!services?.length" class="border-2 border-dashed border-ink/30 py-20 text-center label-meta">
          Aucune prestation disponible pour le moment.
        </div>

        <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          <article
            v-for="(service, i) in services"
            :key="service.id"
            class="group relative bg-paper border-2 border-ink p-6 sm:p-7 flex flex-col cursor-pointer shadow-paper shadow-paper-hover"
            @click="goToBooking"
          >
            <div class="flex items-center justify-between mb-5">
              <span class="label-meta">Nº {{ pad(i + 1) }}</span>
              <span v-if="service.category" class="label-meta text-primary-600">{{ service.category }}</span>
            </div>

            <h3 class="font-display text-2xl sm:text-3xl font-medium leading-[1.05] mb-3">
              {{ service.name }}
            </h3>

            <p v-if="service.description" class="text-ink/65 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
              {{ service.description }}
            </p>
            <div v-else class="flex-1" />

            <div class="pt-5 border-t-2 border-ink/80 flex items-end justify-between">
              <div>
                <div class="label-meta mb-0.5">Durée</div>
                <div class="font-mono text-sm tabular-nums">{{ service.duration }} min</div>
              </div>
              <div class="text-right">
                <div class="label-meta mb-0.5">Tarif</div>
                <div class="font-display text-3xl font-medium tabular-nums leading-none">
                  {{ service.price }}<span class="text-base align-top ml-0.5">€</span>
                </div>
              </div>
            </div>

            <span class="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity text-primary-600 text-lg">→</span>
          </article>
        </div>
      </div>
    </section>

    <!-- ═══════════════════ HORAIRES ═══════════════════ -->
    <section id="horaires" class="relative bg-primary-600 text-canvas border-b-2 border-ink overflow-hidden">
      <div class="absolute right-0 top-0 w-full h-full pointer-events-none select-none opacity-[0.06]" aria-hidden="true">
        <div class="absolute top-10 right-10 font-display italic text-[18rem] leading-none font-light">
          ⏱
        </div>
      </div>

      <div class="relative max-w-[1400px] mx-auto px-5 sm:px-10 py-20 sm:py-28 grid lg:grid-cols-12 gap-10">
        <div class="lg:col-span-5">
          <div class="label-meta text-canvas/60 mb-4">§ 04 — Horaires</div>
          <h2 class="font-display text-4xl sm:text-6xl leading-[0.92] font-medium">
            Quand nous<br />
            <span class="italic font-light">sommes ouverts.</span>
          </h2>

          <div class="mt-8 inline-flex items-center gap-2 bg-canvas text-ink border-2 border-ink px-4 py-2 shadow-paper">
            <span :class="['h-2 w-2 rounded-full', isOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-ink/40']" />
            <span class="label-meta text-ink">
              {{ isOpenNow ? 'Ouvert maintenant' : 'Actuellement fermé' }}
            </span>
          </div>

          <p class="mt-10 text-canvas/75 max-w-sm leading-relaxed">
            Horaires susceptibles d'évoluer pendant les jours fériés. En cas de doute, contactez-nous directement.
          </p>
        </div>

        <div class="lg:col-span-7 lg:col-start-6">
          <div class="bg-canvas text-ink border-2 border-ink shadow-paper">
            <div
              v-for="(jour, i) in JOURS"
              :key="jour"
              :class="[
                'grid grid-cols-12 items-baseline gap-4 py-4 sm:py-5 px-5 transition-colors',
                i < JOURS.length - 1 ? 'border-b border-ink/20' : '',
                jour === todayName ? 'bg-ink text-canvas' : '',
              ]"
            >
              <div class="col-span-1 font-mono text-[11px] tracking-[0.15em]" :class="jour === todayName ? 'text-canvas/50' : 'text-ink/40'">
                {{ pad(i + 1) }}
              </div>
              <div class="col-span-5 font-display text-xl sm:text-2xl font-medium capitalize">
                {{ jour }}
                <span v-if="jour === todayName" class="label-meta ml-2 text-canvas/60">— aujourd'hui</span>
              </div>
              <div class="col-span-6 text-right font-mono text-sm sm:text-base tabular-nums" :class="hoursLabel(i) === 'Fermé' ? 'opacity-40' : ''">
                {{ hoursLabel(i) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════ AVIS (INVERTED) ═══════════════════ -->
    <section v-if="reviews?.length" id="avis" class="relative bg-ink text-canvas grain-light border-b-2 border-ink overflow-hidden">
      <div class="absolute -right-8 top-10 decor-numeral text-canvas/5 pointer-events-none" aria-hidden="true">
        05
      </div>

      <div class="relative max-w-[1400px] mx-auto px-5 sm:px-10 py-20 sm:py-28">

        <div class="flex items-end justify-between flex-wrap gap-6 mb-16">
          <div>
            <div class="label-meta text-primary-500 mb-4">§ 05 — Témoignages</div>
            <h2 class="font-display text-4xl sm:text-6xl leading-[0.92] font-medium">
              Ils en parlent<br />
              <span class="italic font-light">mieux que nous<span class="text-primary-500">.</span></span>
            </h2>
            <div class="mt-6 inline-flex items-center gap-3">
              <div class="flex gap-0.5">
                <svg v-for="i in 5" :key="i" width="18" height="18" viewBox="0 0 24 24" :fill="i <= Math.round(avgRating) ? '#C34A2C' : 'none'" stroke="#C34A2C" stroke-width="1.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <span class="font-display text-xl">{{ avgRating }}/5</span>
              <span class="label-meta text-canvas/50">· {{ reviews.length }} avis vérifiés</span>
            </div>
          </div>
          <NuxtLink to="/avis" class="label-meta link-editorial text-primary-500">
            Laisser un avis →
          </NuxtLink>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          <article
            v-for="(review, i) in reviews.slice(0, 6)"
            :key="review.id"
            class="bg-canvas text-ink border-2 border-canvas p-7 lg:p-8 flex flex-col shadow-paper"
          >
            <div class="flex items-center justify-between mb-6">
              <div class="flex gap-0.5">
                <svg v-for="i2 in 5" :key="i2" width="14" height="14" viewBox="0 0 24 24" :fill="i2 <= review.rating ? '#C34A2C' : 'none'" stroke="#1B1A17" stroke-width="1.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <span class="label-meta">Nº {{ pad(i + 1) }}</span>
            </div>
            <blockquote v-if="review.comment" class="font-display text-xl leading-snug italic text-ink/90 flex-1">
              « {{ review.comment }} »
            </blockquote>
            <div class="mt-8 pt-4 border-t-2 border-ink/15 flex items-center justify-between">
              <span class="font-display text-base font-medium">— {{ review.author }}</span>
              <span class="label-meta">{{ new Date(review.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) }}</span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ═══════════════════ CONTACT ═══════════════════ -->
    <section id="contact" class="relative bg-paper border-b-2 border-ink">
      <div class="max-w-[1400px] mx-auto px-5 sm:px-10 py-20 sm:py-28">
        <div class="grid lg:grid-cols-12 gap-10">
          <div class="lg:col-span-5">
            <div class="label-meta mb-4">§ 06 — Contact</div>
            <h2 class="font-display text-4xl sm:text-6xl leading-[0.92] font-medium">
              Nous trouver,<br />
              <span class="italic font-light">nous joindre<span class="text-primary-500">.</span></span>
            </h2>

            <p class="mt-8 text-ink/70 max-w-sm leading-relaxed">
              Pour les demandes spéciales, privatisations ou questions non couvertes par la réservation en ligne.
            </p>
          </div>
          <div class="lg:col-span-7 lg:col-start-6 grid sm:grid-cols-2 gap-5 sm:gap-6">
            <div class="bg-canvas border-2 border-ink p-7 shadow-paper">
              <div class="label-meta mb-3">Adresse</div>
              <p class="font-display text-xl leading-snug">
                {{ siteConfig.contact.address }}<br />
                {{ siteConfig.contact.postalCode }} {{ siteConfig.contact.city }}
              </p>
              <div class="mt-6 pt-4 border-t border-ink/20">
                <div class="label-meta mb-1">Pays</div>
                <p class="font-display text-base">France</p>
              </div>
            </div>
            <div class="bg-ink text-canvas border-2 border-ink p-7 shadow-paper">
              <div class="label-meta text-canvas/60 mb-3">Téléphone</div>
              <a :href="`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`" class="font-display text-xl link-editorial">{{ siteConfig.contact.phone }}</a>
              <div class="label-meta text-canvas/60 mt-6 mb-3">Email</div>
              <a :href="`mailto:${siteConfig.contact.email}`" class="font-display text-base link-editorial break-all">{{ siteConfig.contact.email }}</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════ FINAL CTA ═══════════════════ -->
    <section class="relative bg-ink text-canvas grain border-b-2 border-ink overflow-hidden">
      <div class="absolute -left-8 -top-16 decor-numeral text-primary-500/10 pointer-events-none" aria-hidden="true">
        07
      </div>

      <div class="relative max-w-[1400px] mx-auto px-5 sm:px-10 py-24 sm:py-32">
        <div class="grid lg:grid-cols-12 gap-10 items-end">
          <div class="lg:col-span-8">
            <div class="label-meta text-primary-500 mb-6">§ 07 — Passage à l'action</div>
            <h2 class="font-display text-5xl sm:text-7xl lg:text-8xl leading-[0.9] font-medium">
              Prêt(e) à<br />
              <span class="italic font-light text-primary-500">réserver</span> votre<br />
              moment ?
            </h2>
          </div>
          <div class="lg:col-span-4 flex flex-col gap-6">
            <button
              @click="goToBooking"
              class="group inline-flex items-center justify-center gap-3 bg-canvas text-ink border-2 border-canvas px-10 py-6 text-lg font-medium tracking-tight hover:bg-primary-500 hover:text-canvas hover:border-primary-500 transition-colors"
            >
              Réserver maintenant
              <span class="transition-transform group-hover:translate-x-1">→</span>
            </button>
            <p class="label-meta text-canvas/60">
              Confirmation instantanée · Moins de deux minutes · Annulation libre jusqu'à la veille.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════ FOOTER ═══════════════════ -->
    <footer class="bg-ink text-canvas/70">
      <div class="max-w-[1400px] mx-auto px-5 sm:px-10 py-10 flex flex-wrap items-center justify-between gap-6">
        <div class="flex items-center gap-4 label-meta text-canvas/50">
          <span class="inline-flex items-center gap-2">
            <span class="h-1.5 w-1.5 rounded-full bg-primary-500" />
            © {{ year }} — {{ siteConfig.name }}
          </span>
          <span class="h-3 w-px bg-canvas/20" />
          <span>{{ siteConfig.contact.city }}, France</span>
        </div>
        <div class="label-meta text-canvas/50">
          Propulsé par <span class="text-canvas font-medium">Booking Pro</span>
        </div>
      </div>
    </footer>

    <StickyBookButton @click="goToBooking" />
    <ToastContainer />
  </div>
</template>
