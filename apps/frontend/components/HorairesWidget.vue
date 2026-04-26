<script setup lang="ts">
const props = defineProps<{
  horaires: Record<string, string>
}>()

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']

const today = new Date()
// getDay: 0=dimanche, 1=lundi...
const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1
const todayName = JOURS[todayIndex]

const isOpenNow = computed(() => {
  const todayHours = props.horaires?.[todayName]
  if (!todayHours || todayHours === 'Fermé') return false

  const [openStr, closeStr] = todayHours.split('-').map(s => s.trim())
  const toMinutes = (s: string) => {
    const [h, m] = s.replace('h', ':').split(':').map(Number)
    return h * 60 + (m || 0)
  }

  const now = today.getHours() * 60 + today.getMinutes()
  return now >= toMinutes(openStr) && now < toMinutes(closeStr)
})
</script>

<template>
  <div>
    <!-- Badge ouvert/fermé -->
    <div class="flex items-center gap-2 mb-4">
      <span
        :class="[
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
          isOpenNow ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'
        ]"
      >
        <span
          :class="[
            'w-2 h-2 rounded-full',
            isOpenNow ? 'bg-green-500 animate-pulse' : 'bg-red-400'
          ]"
        />
        {{ isOpenNow ? 'Ouvert maintenant' : 'Fermé' }}
      </span>
    </div>

    <!-- Grille des horaires -->
    <div class="bg-neutral-50 rounded-xl overflow-hidden">
      <div
        v-for="jour in JOURS"
        :key="jour"
        :class="[
          'flex items-center justify-between px-4 py-3 border-b border-neutral-100 last:border-0',
          jour === todayName ? 'bg-primary-50' : ''
        ]"
      >
        <span
          :class="[
            'text-sm capitalize',
            jour === todayName ? 'font-semibold text-primary-700' : 'text-neutral-600'
          ]"
        >
          {{ jour }}
          <span v-if="jour === todayName" class="text-xs ml-1 text-primary-500">(aujourd'hui)</span>
        </span>
        <span
          :class="[
            'text-sm',
            horaires?.[jour] === 'Fermé' ? 'text-neutral-400' : 'font-medium text-neutral-800'
          ]"
        >
          {{ horaires?.[jour] || 'Non renseigné' }}
        </span>
      </div>
    </div>
  </div>
</template>
