<template>
  <div class="bg-white border border-neutral-100 rounded-xl p-4 sm:p-5 mb-6">
    <h2 class="font-semibold text-neutral-900 mb-4">Semaine à venir</h2>
    <div v-if="loading" class="text-neutral-400">Chargement…</div>
    <div v-else-if="!Object.keys(agenda).length" class="text-neutral-400 text-sm">Aucune réservation dans la semaine.</div>
    <div v-else class="space-y-4">
      <div v-for="(items, day) in agenda" :key="day" class="border-l-2 border-primary-500 pl-4">
        <p class="text-sm font-medium mb-1">{{ formatDay(day) }} <span class="text-neutral-400">({{ totalCovers(items) }} couverts)</span></p>
        <ul class="text-sm space-y-1 text-neutral-500">
          <li v-for="b in items" :key="b.id">
            {{ formatTime(b.date) }} — {{ b.partySize }} couv. — {{ b.clientName }}
            <span v-if="b.status === 'PENDING'" class="ml-2 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">PENDING</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { apiFetch } = useAuth()
const agenda = ref<Record<string, any[]>>({})
const loading = ref(true)

onMounted(async () => {
  const today = new Date().toISOString().slice(0, 10)
  const sevenDays = new Date(); sevenDays.setDate(sevenDays.getDate() + 7)
  const to = sevenDays.toISOString().slice(0, 10)
  const r = await apiFetch<Record<string, any[]>>(`/admin/bookings/agenda?from=${today}&to=${to}`)
  agenda.value = r
  loading.value = false
})

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
function totalCovers(items: any[]) {
  return items.reduce((s, b) => s + b.partySize, 0)
}
</script>
