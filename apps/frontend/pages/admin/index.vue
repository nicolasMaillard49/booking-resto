<script setup lang="ts">
import { CalendarDays, CheckCircle, Hourglass, Euro, Users, TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { apiFetch } = useAuth()

type Period = 'year' | '12m' | '90d' | '30d' | '7d'

interface PeriodSummary {
  from: string
  to: string
  bookings: number
  revenue: number
  uniqueClients: number
}

const stats = ref<{
  today: { total: number; confirmed: number; revenue: number }
  pending: number
  upcoming: Array<{
    id: string; date: string; duration: number
    clientName: string; status: string
    service: { name: string }
  }>
  weeklyStats: Array<{ date: string; count: number }>
  analytics: {
    period: Period
    label: string
    currentPeriod: PeriodSummary
    previousPeriod: PeriodSummary
    busiestDays: Array<{ dayOfWeek: number; count: number }>
    topServices: Array<{ serviceId: string; name: string; count: number; revenue: number }>
  }
} | null>(null)

const loading = ref(true)
const analyticsLoading = ref(false)
const error = ref('')

const period = ref<Period>('year')
const PERIOD_OPTIONS: Array<{ value: Period; label: string }> = [
  { value: 'year', label: 'Année en cours' },
  { value: '12m', label: '12 mois' },
  { value: '90d', label: '90 jours' },
  { value: '30d', label: '30 jours' },
  { value: '7d', label: '7 jours' },
]

async function loadStats(p: Period = period.value) {
  try {
    stats.value = await apiFetch(`/stats`, { params: { period: p } })
  } catch {
    error.value = 'Impossible de charger les statistiques'
  } finally {
    loading.value = false
    analyticsLoading.value = false
  }
}

onMounted(() => loadStats())

async function changePeriod(p: Period) {
  if (p === period.value) return
  period.value = p
  analyticsLoading.value = true
  await loadStats(p)
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const JOURS_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

function trend(current: number, previous: number): { dir: 'up' | 'down' | 'flat'; pct: number } {
  if (previous === 0) return { dir: current > 0 ? 'up' : 'flat', pct: 0 }
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct > 0) return { dir: 'up', pct }
  if (pct < 0) return { dir: 'down', pct: Math.abs(pct) }
  return { dir: 'flat', pct: 0 }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-neutral-900 mb-6 sm:mb-8">Dashboard</h1>

    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
      <div v-for="i in 4" :key="i" class="h-28 bg-white rounded-xl animate-pulse" />
    </div>

    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl mb-8">{{ error }}</div>

    <template v-else-if="stats">
      <!-- Stats du jour -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <AdminStatCard title="RDV aujourd'hui" :value="stats.today.total" :icon="CalendarDays" color="blue" />
        <AdminStatCard title="Confirmés" :value="stats.today.confirmed" :icon="CheckCircle" color="green" />
        <AdminStatCard title="En attente" :value="stats.pending" :icon="Hourglass" color="yellow" />
        <AdminStatCard title="CA du jour" :value="`${stats.today.revenue} €`" :icon="Euro" color="purple" />
      </div>

      <!-- Prochains RDV -->
      <div class="bg-white rounded-xl border border-neutral-100 overflow-hidden mb-6 sm:mb-8">
        <div class="px-4 sm:px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 class="font-semibold text-neutral-900">Prochains rendez-vous</h2>
          <NuxtLink to="/admin/reservations" class="text-sm text-primary-600 hover:underline">Voir tout →</NuxtLink>
        </div>

        <div v-if="!stats.upcoming.length" class="px-4 sm:px-6 py-8 text-center text-neutral-400">
          Aucun rendez-vous à venir
        </div>

        <div v-else class="divide-y divide-neutral-50">
          <NuxtLink
            v-for="booking in stats.upcoming"
            :key="booking.id"
            :to="`/admin/reservations/${booking.id}`"
            class="px-4 sm:px-6 py-4 flex items-center justify-between gap-3 hover:bg-neutral-50 transition-colors group"
          >
            <div class="min-w-0">
              <p class="font-medium text-neutral-800 truncate group-hover:text-primary-600 transition-colors">{{ booking.clientName }}</p>
              <p class="text-sm text-neutral-500 truncate">{{ booking.service.name }} · {{ booking.duration }} min</p>
            </div>
            <div class="text-right flex-shrink-0 flex items-center gap-2">
              <div>
                <p class="text-xs sm:text-sm font-medium text-neutral-700">{{ formatDateTime(booking.date) }}</p>
                <AdminStatusBadge :status="booking.status" />
              </div>
              <span class="text-neutral-300 group-hover:text-primary-600 transition-colors">→</span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Graphique courbe 7 derniers jours -->
      <AdminWeeklyChart :data="stats.weeklyStats" />

      <!-- ═══════════════════ STATISTIQUES ANALYTIQUES ═══════════════════ -->
      <div class="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-neutral-900">Statistiques — {{ stats.analytics.label }}</h2>
          <p class="text-xs text-neutral-400">Comparé à la période précédente équivalente</p>
        </div>
        <div class="flex flex-wrap gap-1.5 p-1 bg-neutral-100 rounded-lg w-fit">
          <button
            v-for="opt in PERIOD_OPTIONS"
            :key="opt.value"
            @click="changePeriod(opt.value)"
            :disabled="analyticsLoading"
            :class="[
              'px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors disabled:opacity-60',
              period === opt.value
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            ]"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Comparatif courant vs précédent -->
      <div
        :class="[
          'grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 transition-opacity',
          analyticsLoading ? 'opacity-50 pointer-events-none' : ''
        ]"
      >
        <div
          v-for="metric in [
            { key: 'bookings', label: 'Réservations', icon: CalendarDays, suffix: '' },
            { key: 'uniqueClients', label: 'Clients uniques', icon: Users, suffix: '' },
            { key: 'revenue', label: 'CA encaissé', icon: Euro, suffix: ' €' },
          ]"
          :key="metric.key"
          class="bg-white border border-neutral-100 rounded-xl p-4 sm:p-5"
        >
          <div class="flex items-center justify-between mb-3 gap-2">
            <div class="flex items-center gap-2 text-neutral-500 text-xs sm:text-sm min-w-0">
              <component :is="metric.icon" class="w-4 h-4 flex-shrink-0" />
              <span class="truncate">{{ metric.label }}</span>
            </div>
            <span
              :class="[
                'text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 flex-shrink-0',
                trend(stats.analytics.currentPeriod[metric.key as keyof PeriodSummary] as number, stats.analytics.previousPeriod[metric.key as keyof PeriodSummary] as number).dir === 'up' ? 'bg-green-50 text-green-700' :
                trend(stats.analytics.currentPeriod[metric.key as keyof PeriodSummary] as number, stats.analytics.previousPeriod[metric.key as keyof PeriodSummary] as number).dir === 'down' ? 'bg-red-50 text-red-700' :
                'bg-neutral-100 text-neutral-500'
              ]"
            >
              <TrendingUp v-if="trend(stats.analytics.currentPeriod[metric.key as keyof PeriodSummary] as number, stats.analytics.previousPeriod[metric.key as keyof PeriodSummary] as number).dir === 'up'" class="w-3 h-3" />
              <TrendingDown v-else-if="trend(stats.analytics.currentPeriod[metric.key as keyof PeriodSummary] as number, stats.analytics.previousPeriod[metric.key as keyof PeriodSummary] as number).dir === 'down'" class="w-3 h-3" />
              <Minus v-else class="w-3 h-3" />
              {{ trend(stats.analytics.currentPeriod[metric.key as keyof PeriodSummary] as number, stats.analytics.previousPeriod[metric.key as keyof PeriodSummary] as number).pct }}%
            </span>
          </div>
          <div class="flex items-baseline justify-between gap-2">
            <div class="min-w-0">
              <p class="text-xl sm:text-2xl font-bold text-neutral-900 tabular-nums truncate">
                {{ stats.analytics.currentPeriod[metric.key as keyof PeriodSummary] }}{{ metric.suffix }}
              </p>
              <p class="text-[10px] sm:text-xs text-neutral-400">Actuel</p>
            </div>
            <div class="text-right min-w-0">
              <p class="text-base sm:text-lg font-medium text-neutral-400 tabular-nums truncate">
                {{ stats.analytics.previousPeriod[metric.key as keyof PeriodSummary] }}{{ metric.suffix }}
              </p>
              <p class="text-[10px] sm:text-xs text-neutral-400">Précédent</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Top jours + Top services -->
      <div
        :class="[
          'grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 transition-opacity',
          analyticsLoading ? 'opacity-50 pointer-events-none' : ''
        ]"
      >
        <div class="bg-white border border-neutral-100 rounded-xl p-4 sm:p-5">
          <h3 class="font-semibold text-neutral-900 mb-4">Jours les plus fréquentés</h3>
          <div v-if="!stats.analytics.busiestDays.some(d => d.count > 0)" class="text-neutral-400 text-sm py-4 text-center">
            Aucune donnée sur cette période
          </div>
          <ol v-else class="space-y-3">
            <li
              v-for="(day, idx) in stats.analytics.busiestDays"
              :key="day.dayOfWeek"
              class="flex items-center gap-3"
            >
              <span
                :class="[
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
                  idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                  idx === 1 ? 'bg-neutral-100 text-neutral-600' :
                  'bg-orange-50 text-orange-700'
                ]"
              >
                {{ idx + 1 }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1 gap-2">
                  <span class="font-medium text-neutral-800 truncate">{{ JOURS_FULL[day.dayOfWeek] }}</span>
                  <span class="text-sm text-neutral-500 tabular-nums whitespace-nowrap">{{ day.count }} RDV</span>
                </div>
                <div class="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary-500"
                    :style="{ width: `${stats.analytics.busiestDays[0].count ? (day.count / stats.analytics.busiestDays[0].count) * 100 : 0}%` }"
                  />
                </div>
              </div>
            </li>
          </ol>
        </div>

        <div class="bg-white border border-neutral-100 rounded-xl p-4 sm:p-5">
          <h3 class="font-semibold text-neutral-900 mb-4">Prestations les plus demandées</h3>
          <div v-if="!stats.analytics.topServices.length" class="text-neutral-400 text-sm py-4 text-center">
            Aucune prestation sur cette période
          </div>
          <ol v-else class="space-y-3">
            <li
              v-for="(svc, idx) in stats.analytics.topServices"
              :key="svc.serviceId"
              class="flex items-center gap-3"
            >
              <span
                :class="[
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
                  idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                  idx === 1 ? 'bg-neutral-100 text-neutral-600' :
                  'bg-orange-50 text-orange-700'
                ]"
              >
                {{ idx + 1 }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1 gap-2">
                  <span class="font-medium text-neutral-800 truncate">{{ svc.name }}</span>
                  <span class="text-xs sm:text-sm text-neutral-500 tabular-nums whitespace-nowrap">
                    {{ svc.count }} · {{ svc.revenue }} €
                  </span>
                </div>
                <div class="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary-500"
                    :style="{ width: `${stats.analytics.topServices[0].count ? (svc.count / stats.analytics.topServices[0].count) * 100 : 0}%` }"
                  />
                </div>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </template>
  </div>
</template>
