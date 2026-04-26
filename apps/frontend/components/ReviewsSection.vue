<script setup lang="ts">
import type { ReviewPublic } from '@booking-resto/shared'

defineProps<{ reviews: ReviewPublic[] }>()

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
}
</script>

<template>
  <div>
    <!-- Résumé -->
    <div v-if="reviews.length" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div
        v-for="review in reviews.slice(0, 6)"
        :key="review.id"
        class="bg-white rounded-xl p-5 border border-neutral-100"
      >
        <div class="flex items-center gap-1 mb-2">
          <span v-for="i in 5" :key="i" :class="['text-sm', i <= review.rating ? 'text-yellow-400' : 'text-neutral-200']">
            ★
          </span>
        </div>
        <p v-if="review.comment" class="text-neutral-700 text-sm leading-relaxed mb-3 line-clamp-3">
          "{{ review.comment }}"
        </p>
        <p class="text-xs text-neutral-400">
          <span class="font-medium text-neutral-600">{{ review.author }}</span>
          · {{ formatDate(review.createdAt) }}
        </p>
      </div>
    </div>

    <div v-else class="text-center py-8 text-neutral-400">
      <p>Aucun avis pour le moment. Soyez le premier !</p>
    </div>
  </div>
</template>
