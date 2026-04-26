<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { apiFetch } = useAuth()
const toast = useToast()

// ── Vue calendrier semaine ───────────────────────────────
const today = new Date()
const weekStart = ref(getMonday(today))

interface Booking {
  id: string; clientName: string; date: string; duration: number; status: string
  service: { name: string }
}

const bookings = ref<Booking[]>([])
const loading = ref(false)

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const weekDays = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    return d
  })
})

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

async function loadWeekBookings() {
  loading.value = true
  const start = weekStart.value.toISOString().split('T')[0]
  const end = weekDays.value[6].toISOString().split('T')[0]

  try {
    const result = await apiFetch<{ data: Booking[] }>('/bookings', {
      params: { limit: 100 },
    })
    // Filtrer sur la semaine côté client
    bookings.value = result.data.filter(b => {
      const d = b.date.split('T')[0]
      return d >= start && d <= end
    })
  } catch {
    toast.error('Erreur chargement agenda')
  } finally {
    loading.value = false
  }
}

function getBookingsForDay(day: Date): Booking[] {
  const dayStr = day.toISOString().split('T')[0]
  return bookings.value.filter(b => b.date.startsWith(dayStr))
}

function prevWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() - 7)
  weekStart.value = d
  loadWeekBookings()
}

function nextWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + 7)
  weekStart.value = d
  loadWeekBookings()
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  CONFIRMED: 'bg-green-100 border-green-300 text-green-800',
  CANCELLED: 'bg-red-50 border-red-200 text-red-500',
  COMPLETED: 'bg-neutral-100 border-neutral-200 text-neutral-500',
  NO_SHOW: 'bg-orange-100 border-orange-200 text-orange-600',
}

onMounted(loadWeekBookings)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-neutral-900">Agenda</h1>
      <div class="flex items-center gap-3">
        <button @click="prevWeek" class="p-2 hover:bg-neutral-100 rounded-lg transition-colors">←</button>
        <span class="text-sm font-medium text-neutral-700">
          {{ weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) }}
          —
          {{ weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }}
        </span>
        <button @click="nextWeek" class="p-2 hover:bg-neutral-100 rounded-lg transition-colors">→</button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-neutral-100 overflow-hidden">
      <!-- En-têtes jours -->
      <div class="grid grid-cols-7 border-b border-neutral-100">
        <div
          v-for="(day, idx) in weekDays"
          :key="idx"
          :class="[
            'px-3 py-3 text-center',
            day.toDateString() === today.toDateString() ? 'bg-primary-50' : ''
          ]"
        >
          <p class="text-xs text-neutral-400 uppercase">{{ JOURS[idx] }}</p>
          <p :class="[
            'text-lg font-bold mt-0.5',
            day.toDateString() === today.toDateString() ? 'text-primary-600' : 'text-neutral-700'
          ]">{{ day.getDate() }}</p>
        </div>
      </div>

      <!-- Contenu jours -->
      <div v-if="loading" class="h-64 flex items-center justify-center text-neutral-400">
        <div class="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>

      <div v-else class="grid grid-cols-7 min-h-[200px]">
        <div
          v-for="(day, idx) in weekDays"
          :key="idx"
          :class="[
            'p-2 border-r border-neutral-50 last:border-0',
            day.toDateString() === today.toDateString() ? 'bg-primary-50/50' : ''
          ]"
        >
          <div
            v-for="booking in getBookingsForDay(day)"
            :key="booking.id"
            :class="[
              'text-xs p-1.5 mb-1 rounded border cursor-pointer hover:opacity-80 transition-opacity',
              statusColors[booking.status] || 'bg-neutral-100 border-neutral-200'
            ]"
            @click="navigateTo(`/admin/reservations/${booking.id}`)"
          >
            <p class="font-medium truncate">{{ new Date(booking.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}</p>
            <p class="truncate">{{ booking.clientName }}</p>
            <p class="truncate opacity-70">{{ booking.service.name }}</p>
          </div>
        </div>
      </div>
    </div>

    <ToastContainer />
  </div>
</template>
