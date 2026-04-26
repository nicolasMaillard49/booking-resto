<script setup lang="ts">
// ============================================================
// SlotPicker — Sélection de la date et du créneau horaire
// ============================================================

const props = defineProps<{
  serviceDuration?: number
}>()

const emit = defineEmits<{
  select: [date: string, time: string]
}>()

const config = useRuntimeConfig()
const baseUrl = config.public.apiUrl

// ── Calendrier ───────────────────────────────────────────
const today = new Date()
today.setHours(0, 0, 0, 0)

const selectedDate = ref<Date>(getNextAvailableDay(today))
const slots = ref<{ time: string; available: boolean }[]>([])
const loadingSlots = ref(false)
const noSlotsReason = ref<string | null>(null)

// Jours de la semaine affichés (7 jours à partir d'aujourd'hui)
const calendarDays = computed(() => {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i + 1) // +1: pas de RDV le jour même
    return d
  })
})

const selectedDateStr = computed(() => {
  return selectedDate.value.toISOString().split('T')[0]
})

function getNextAvailableDay(from: Date): Date {
  const d = new Date(from)
  d.setDate(d.getDate() + 1) // Commence demain
  return d
}

async function loadSlots(date: Date) {
  selectedDate.value = date
  loadingSlots.value = true
  noSlotsReason.value = null
  slots.value = []

  const dateStr = date.toISOString().split('T')[0]

  try {
    const params: Record<string, string | number> = { date: dateStr }
    if (props.serviceDuration) {
      params.duration = props.serviceDuration
    }

    const result = await $fetch<{
      slots: { time: string; available: boolean }[]
      reason?: string
    }>(`${baseUrl}/public/availability-slots`, { params })

    slots.value = result.slots
    if (result.reason) {
      noSlotsReason.value = result.reason === 'closed' ? 'Fermé ce jour' : 'Pas de créneaux disponibles'
    }
  } catch {
    noSlotsReason.value = 'Impossible de charger les disponibilités'
  } finally {
    loadingSlots.value = false
  }
}

// Charge les créneaux au montage
onMounted(() => loadSlots(selectedDate.value))

// ── Formatage ───────────────────────────────────────────
function formatDayName(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short' })
}

function formatDayNum(date: Date): string {
  return date.getDate().toString()
}

function isSelected(date: Date): boolean {
  return date.toDateString() === selectedDate.value.toDateString()
}

function formatMonthYear(): string {
  return selectedDate.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

// Grouper les créneaux par heure pour l'affichage
const slotsByHour = computed(() => {
  const groups: Record<string, { time: string; available: boolean }[]> = {}
  for (const slot of slots.value) {
    const hour = slot.time.split(':')[0]
    if (!groups[hour]) groups[hour] = []
    groups[hour].push(slot)
  }
  return groups
})

const availableCount = computed(() => slots.value.filter(s => s.available).length)
</script>

<template>
  <div>
    <!-- Titre avec mois -->
    <p class="text-neutral-500 text-sm mb-3 capitalize">{{ formatMonthYear() }}</p>

    <!-- Sélecteur de date (horizontal scroll) -->
    <div class="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
      <button
        v-for="day in calendarDays"
        :key="day.toDateString()"
        @click="loadSlots(day)"
        :class="[
          'flex flex-col items-center min-w-[52px] py-2 px-1 rounded-xl transition-all',
          isSelected(day)
            ? 'bg-primary-600 text-white'
            : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
        ]"
      >
        <span class="text-xs uppercase">{{ formatDayName(day) }}</span>
        <span class="text-lg font-bold leading-tight">{{ formatDayNum(day) }}</span>
      </button>
    </div>

    <!-- Date sélectionnée -->
    <p class="font-medium text-neutral-700 mb-4">
      {{
        selectedDate.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      }}
    </p>

    <!-- Loading -->
    <div v-if="loadingSlots" class="space-y-2">
      <div v-for="i in 6" :key="i" class="h-10 bg-neutral-100 rounded-lg animate-pulse" />
    </div>

    <!-- Raison: fermé ou pas de créneaux -->
    <div v-else-if="noSlotsReason" class="text-center py-8 text-neutral-400">
      <p class="text-4xl mb-2">😔</p>
      <p>{{ noSlotsReason }}</p>
      <p class="text-sm mt-1">Essayez une autre date</p>
    </div>

    <!-- Grille de créneaux par heure -->
    <div v-else-if="slots.length">
      <p class="text-sm text-neutral-400 mb-3">
        {{ availableCount }} créneau{{ availableCount > 1 ? 'x' : '' }} disponible{{ availableCount > 1 ? 's' : '' }}
      </p>

      <div v-for="(hourSlots, hour) in slotsByHour" :key="hour" class="mb-4">
        <p class="text-xs text-neutral-400 uppercase mb-2">{{ hour }}h</p>
        <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
          <button
            v-for="slot in hourSlots"
            :key="slot.time"
            :disabled="!slot.available"
            @click="slot.available && emit('select', selectedDateStr, slot.time)"
            :class="[
              'py-2.5 rounded-lg text-sm font-medium transition-all',
              slot.available
                ? 'bg-white border border-primary-200 text-primary-700 hover:bg-primary-50 hover:border-primary-400'
                : 'bg-neutral-50 border border-neutral-100 text-neutral-300 cursor-not-allowed line-through',
            ]"
          >
            {{ slot.time }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
