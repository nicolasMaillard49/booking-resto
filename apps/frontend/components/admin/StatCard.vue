<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  title: string
  value: string | number
  icon: Component
  color?: 'blue' | 'green' | 'yellow' | 'purple'
}>()

const colorClasses: Record<string, string> = {
  blue:   'bg-blue-50 text-blue-600',
  green:  'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  purple: 'bg-purple-50 text-purple-600',
}
</script>

<template>
  <div class="bg-white rounded-xl border border-neutral-100 p-5">
    <div class="flex items-center justify-between mb-3">
      <p class="text-sm text-neutral-500">{{ title }}</p>
      <div :class="['w-9 h-9 rounded-lg flex items-center justify-center', colorClasses[color || 'blue']]">
        <component :is="icon" :size="18" :stroke-width="1.8" />
      </div>
    </div>
    <p class="text-2xl font-bold text-neutral-900">{{ value }}</p>
  </div>
</template>
