<script setup lang="ts">
import { Star } from 'lucide-vue-next'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { apiFetch } = useAuth()
const toast = useToast()

interface Review {
  id: string; author: string; rating: number; comment: string | null
  isApproved: boolean; createdAt: string
}

const reviews = ref<Review[]>([])
const loading = ref(true)
const filter = ref<'all' | 'pending' | 'approved'>('all')

async function loadReviews() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (filter.value === 'pending') params.approved = 'false'
    if (filter.value === 'approved') params.approved = 'true'
    reviews.value = await apiFetch<Review[]>('/admin/reviews', { params })
  } finally {
    loading.value = false
  }
}

async function moderate(id: string, isApproved: boolean) {
  try {
    await apiFetch(`/reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isApproved }),
    })
    await loadReviews()
    toast.success(isApproved ? 'Avis approuvé' : 'Avis rejeté')
  } catch {
    toast.error('Erreur')
  }
}

onMounted(loadReviews)
watch(filter, loadReviews)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-neutral-900">Modération des avis</h1>
    </div>

    <!-- Filtres -->
    <div class="flex gap-2 mb-6">
      <button v-for="f in [{ v: 'all', l: 'Tous' }, { v: 'pending', l: 'En attente' }, { v: 'approved', l: 'Approuvés' }]"
        :key="f.v"
        @click="filter = f.v as typeof filter"
        :class="['px-4 py-2 rounded-lg text-sm font-medium transition-colors', filter === f.v ? 'bg-primary-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50']"
      >{{ f.l }}</button>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-24 bg-white rounded-xl animate-pulse" />
    </div>

    <div v-else-if="!reviews.length" class="text-center py-12 text-neutral-400">
      <Star :size="40" :stroke-width="1.4" class="mx-auto mb-3 text-neutral-300" />
      <p>Aucun avis</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="review in reviews"
        :key="review.id"
        class="bg-white rounded-xl border border-neutral-100 p-5"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-semibold text-neutral-800">{{ review.author }}</span>
              <div class="flex gap-0.5">
                <span v-for="i in 5" :key="i" :class="['text-sm', i <= review.rating ? 'text-yellow-400' : 'text-neutral-200']">★</span>
              </div>
              <span class="text-xs text-neutral-400">{{ new Date(review.createdAt).toLocaleDateString('fr-FR') }}</span>
            </div>
            <p v-if="review.comment" class="text-neutral-600 text-sm">{{ review.comment }}</p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span :class="['text-xs px-2 py-1 rounded-full', review.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700']">
              {{ review.isApproved ? 'Approuvé' : 'En attente' }}
            </span>
            <button
              v-if="!review.isApproved"
              @click="moderate(review.id, true)"
              class="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >Approuver</button>
            <button
              v-if="review.isApproved"
              @click="moderate(review.id, false)"
              class="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >Rejeter</button>
          </div>
        </div>
      </div>
    </div>

    <ToastContainer />
  </div>
</template>
