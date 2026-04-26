<script setup lang="ts">
import type { ServicePublic } from '@booking-pro/shared'

defineProps<{
  service: ServicePublic
  interactive?: boolean
}>()

defineEmits<{ click: [] }>()
</script>

<template>
  <div
    :class="[
      'bg-white rounded-xl p-5 border border-neutral-100 transition-all',
      interactive ? 'cursor-pointer hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5' : ''
    ]"
    :role="interactive ? 'button' : undefined"
    :tabindex="interactive ? 0 : undefined"
    @click="interactive && $emit('click')"
    @keydown.enter="interactive && $emit('click')"
    @keydown.space.prevent="interactive && $emit('click')"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-neutral-900 text-base truncate">{{ service.name }}</h3>
        <p v-if="service.category" class="text-xs text-neutral-400 uppercase tracking-wide mt-0.5">
          {{ service.category }}
        </p>
        <p v-if="service.description" class="text-neutral-500 text-sm mt-2 line-clamp-2">
          {{ service.description }}
        </p>
      </div>
      <div class="text-right shrink-0">
        <p class="text-lg font-bold text-neutral-900">{{ service.price }} €</p>
        <p class="text-sm text-neutral-400">{{ service.duration }} min</p>
      </div>
    </div>
    
    <div v-if="interactive" class="mt-4 flex items-center text-primary-600 text-sm font-medium">
      Choisir <span class="ml-1">→</span>
    </div>
  </div>
</template>
