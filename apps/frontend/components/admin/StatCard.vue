<template>
  <div class="bg-white border border-neutral-100 rounded-xl p-4 sm:p-5">
    <p class="text-xs sm:text-sm text-neutral-500 mb-2">{{ label }}</p>
    <p class="text-xl sm:text-2xl font-bold text-neutral-900 tabular-nums">{{ value }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string | number }>()
</script>
