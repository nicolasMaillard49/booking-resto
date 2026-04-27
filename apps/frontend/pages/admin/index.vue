<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
const { apiFetch } = useAuth()
const overview = ref<any>(null)
const loading = ref(true)

const todayISO = new Date().toISOString().slice(0, 10)
const selectedDate = ref(todayISO)

async function loadOverview() {
  loading.value = true
  try {
    overview.value = await apiFetch(`/admin/stats/overview?date=${selectedDate.value}`)
  } finally {
    loading.value = false
  }
}

onMounted(loadOverview)
watch(selectedDate, loadOverview)

const maxCouverts = computed(() =>
  Math.max(...(overview.value?.chart7d?.map((d: any) => d.couverts) ?? [0]), 1),
)

const isToday = computed(() => selectedDate.value === todayISO)
const dateLabel = computed(() => {
  if (isToday.value) return "aujourd'hui"
  const d = new Date(selectedDate.value)
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6 sm:mb-8 gap-4 flex-wrap">
      <h1 class="text-2xl font-bold text-neutral-900">Dashboard</h1>
      <div class="w-full sm:w-72">
        <DatePicker v-model="selectedDate" placeholder="Choisir un jour" />
      </div>
    </div>

    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
      <div v-for="i in 4" :key="i" class="h-28 bg-white animate-pulse" />
    </div>

    <template v-else-if="overview">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <AdminStatCard :label="`Couverts ${dateLabel}`" :value="overview.couvertsToday" />
        <AdminStatCard :label="`Réservations ${dateLabel}`" :value="overview.bookingsToday" />
        <AdminStatCard label="En attente" :value="overview.pendingCount" />
        <AdminStatCard label="Remplissage midi/soir" :value="`${overview.tauxRemplissageMidi}% / ${overview.tauxRemplissageSoir}%`" />
      </div>

      <AdminWeekAgendaCard />

      <div class="bg-white border border-neutral-100 p-4 sm:p-6">
        <h2 class="font-semibold text-neutral-900 mb-4">Couverts sur 7 jours</h2>
        <div class="flex items-end gap-2 h-32">
          <div v-for="d in overview.chart7d" :key="d.date" class="flex-1 flex flex-col items-center">
            <div class="w-full bg-primary-500 transition-all" :style="{ height: `${(d.couverts / maxCouverts) * 100}%` }"></div>
            <p class="text-xs text-neutral-400 mt-1">{{ d.date.slice(5) }}</p>
            <p class="text-xs font-medium">{{ d.couverts }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
