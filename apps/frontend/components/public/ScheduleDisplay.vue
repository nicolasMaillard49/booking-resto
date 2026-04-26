<template>
  <div class="space-y-1.5 text-sm">
    <div v-for="line in lines" :key="line.label">
      <span class="font-medium">{{ line.label }} :</span> {{ line.times }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface SW { id: string; label: string; daysOfWeek: number[]; startTime: string; endTime: string; isActive: boolean }
const props = defineProps<{ windows: SW[] }>()

const DAY_NAMES = ['', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const lines = computed(() =>
  props.windows.map(w => ({
    label: `${w.label} (${w.daysOfWeek.map(d => DAY_NAMES[d]).join(' ')})`,
    times: `${w.startTime} – ${w.endTime}`,
  })),
)
</script>
