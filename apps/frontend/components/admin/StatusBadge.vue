<script setup lang="ts">
defineProps<{ status: string }>()

const config: Record<string, { label: string; classes: string }> = {
  PENDING:   { label: 'En attente', classes: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Confirmé',   classes: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Annulé',     classes: 'bg-red-100 text-red-600' },
  COMPLETED: { label: 'Complété',   classes: 'bg-neutral-100 text-neutral-500' },
  NO_SHOW:   { label: 'Absent',     classes: 'bg-orange-100 text-orange-600' },
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      config[status]?.classes || 'bg-neutral-100 text-neutral-500'
    ]"
  >
    {{ config[status]?.label || status }}
  </span>
</template>
