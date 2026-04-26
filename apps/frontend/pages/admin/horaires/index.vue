<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { apiFetch } = useAuth()
const config = useRuntimeConfig()
const baseUrl = config.public.apiUrl
const toast = useToast()

const JOURS = [
  { id: 0, label: 'Lundi' }, { id: 1, label: 'Mardi' }, { id: 2, label: 'Mercredi' },
  { id: 3, label: 'Jeudi' }, { id: 4, label: 'Vendredi' }, { id: 5, label: 'Samedi' },
  { id: 6, label: 'Dimanche' },
]

const schedule = ref(JOURS.map(j => ({
  dayOfWeek: j.id,
  startTime: '09:00',
  endTime: '19:00',
  isActive: j.id < 5,
})))

const loading = ref(true)
const saving = ref(false)

onMounted(async () => {
  try {
    const data = await $fetch<Array<{ dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }>>(
      `${baseUrl}/public/schedule`
    )

    for (const item of data) {
      const idx = schedule.value.findIndex(s => s.dayOfWeek === item.dayOfWeek)
      if (idx >= 0) schedule.value[idx] = { ...schedule.value[idx], ...item }
    }
  } catch {
    toast.error('Erreur chargement horaires')
  } finally {
    loading.value = false
  }
})

async function saveSchedule() {
  saving.value = true
  try {
    await apiFetch('/availability', {
      method: 'PUT',
      body: JSON.stringify({ schedule: schedule.value }),
    })
    toast.success('Horaires sauvegardés')
  } catch {
    toast.error('Erreur lors de la sauvegarde')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-neutral-900">Horaires</h1>
      <button
        @click="saveSchedule"
        :disabled="saving || loading"
        class="bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        {{ saving ? 'Sauvegarde...' : 'Sauvegarder' }}
      </button>
    </div>

    <div class="bg-white rounded-xl border border-neutral-100 overflow-hidden">
      <div v-if="loading" class="divide-y divide-neutral-50">
        <div v-for="i in 7" :key="i" class="px-6 py-4 animate-pulse h-16" />
      </div>

      <div v-else class="divide-y divide-neutral-50">
        <div
          v-for="(day, idx) in schedule"
          :key="day.dayOfWeek"
          class="px-6 py-4 flex items-center gap-6"
        >
          <div class="w-32 flex items-center gap-3">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="schedule[idx].isActive" class="sr-only peer" />
              <div class="w-10 h-6 bg-neutral-200 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
            <span :class="['text-sm font-medium', day.isActive ? 'text-neutral-800' : 'text-neutral-400']">
              {{ JOURS[day.dayOfWeek].label }}
            </span>
          </div>

          <div v-if="day.isActive" class="flex items-center gap-3">
            <input
              v-model="schedule[idx].startTime"
              type="time"
              class="border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span class="text-neutral-400">—</span>
            <input
              v-model="schedule[idx].endTime"
              type="time"
              class="border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <span v-else class="text-sm text-neutral-400">Fermé</span>
        </div>
      </div>
    </div>

    <ToastContainer />
  </div>
</template>
