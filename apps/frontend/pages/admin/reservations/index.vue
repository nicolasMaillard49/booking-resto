<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

import type { BookingStatus } from '@booking-pro/shared'

const { apiFetch } = useAuth()

// ── Filtres ───────────────────────────────────────────────
const filters = reactive({
  page: 1,
  limit: 20,
  status: '',
  date: '',
})

interface Booking {
  id: string
  clientName: string
  clientEmail: string
  clientPhone: string
  date: string
  duration: number
  status: string
  notes: string | null
  amount: number | null
  service: { id: string; name: string; price: number }
}

interface PaginatedBookings {
  data: Booking[]
  meta: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean }
}

const result = ref<PaginatedBookings | null>(null)
const loading = ref(false)

async function loadBookings() {
  loading.value = true
  try {
    const params: Record<string, string | number> = {
      page: filters.page,
      limit: filters.limit,
    }
    if (filters.status) params.status = filters.status
    if (filters.date) params.date = filters.date

    result.value = await apiFetch<PaginatedBookings>('/bookings', { params })
  } catch (error) {
    console.error('Erreur chargement réservations:', error)
  } finally {
    loading.value = false
  }
}

onMounted(loadBookings)
watch(filters, () => { filters.page = 1; loadBookings() }, { deep: true })

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-neutral-900">Réservations</h1>
      <span v-if="result" class="text-sm text-neutral-400">{{ result.meta.total }} total</span>
    </div>

    <!-- Filtres -->
    <div class="bg-white rounded-xl border border-neutral-100 p-4 mb-6 flex flex-wrap gap-3">
      <select
        v-model="filters.status"
        class="border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">Tous les statuts</option>
        <option value="PENDING">En attente</option>
        <option value="CONFIRMED">Confirmé</option>
        <option value="CANCELLED">Annulé</option>
        <option value="COMPLETED">Complété</option>
        <option value="NO_SHOW">Absent</option>
      </select>

      <input
        v-model="filters.date"
        type="date"
        class="border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      <button
        @click="filters.status = ''; filters.date = ''"
        class="text-sm text-neutral-500 hover:text-neutral-700"
      >
        Réinitialiser
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-neutral-100 overflow-hidden">
      <div v-if="loading" class="divide-y divide-neutral-50">
        <div v-for="i in 5" :key="i" class="px-6 py-4 animate-pulse">
          <div class="h-4 bg-neutral-100 rounded w-3/4 mb-2" />
          <div class="h-3 bg-neutral-100 rounded w-1/2" />
        </div>
      </div>

      <div v-else-if="!result?.data.length" class="px-6 py-12 text-center text-neutral-400">
        Aucune réservation trouvée
      </div>

      <div v-else>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th class="text-left px-6 py-3 text-xs font-medium text-neutral-500 uppercase">Client</th>
                <th class="text-left px-6 py-3 text-xs font-medium text-neutral-500 uppercase">Service</th>
                <th class="text-left px-6 py-3 text-xs font-medium text-neutral-500 uppercase">Date</th>
                <th class="text-left px-6 py-3 text-xs font-medium text-neutral-500 uppercase">Statut</th>
                <th class="text-left px-6 py-3 text-xs font-medium text-neutral-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50">
              <tr
                v-for="booking in result.data"
                :key="booking.id"
                class="hover:bg-neutral-50 transition-colors"
              >
                <td class="px-6 py-4">
                  <p class="font-medium text-neutral-800">{{ booking.clientName }}</p>
                  <p class="text-sm text-neutral-400">{{ booking.clientEmail }}</p>
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm text-neutral-700">{{ booking.service.name }}</p>
                  <p class="text-xs text-neutral-400">{{ booking.duration }} min</p>
                </td>
                <td class="px-6 py-4 text-sm text-neutral-700">{{ formatDate(booking.date) }}</td>
                <td class="px-6 py-4">
                  <AdminStatusBadge :status="booking.status" />
                </td>
                <td class="px-6 py-4">
                  <NuxtLink
                    :to="`/admin/reservations/${booking.id}`"
                    class="text-sm text-primary-600 hover:underline"
                  >
                    Voir →
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="result.meta.totalPages > 1" class="px-6 py-4 border-t border-neutral-100 flex items-center justify-between">
          <button
            :disabled="filters.page <= 1"
            @click="filters.page--"
            class="px-4 py-2 text-sm border border-neutral-200 rounded-lg disabled:opacity-40 hover:bg-neutral-50 transition-colors"
          >
            ← Précédent
          </button>
          <span class="text-sm text-neutral-400">
            Page {{ result.meta.page }} / {{ result.meta.totalPages }}
          </span>
          <button
            :disabled="!result.meta.hasNextPage"
            @click="filters.page++"
            class="px-4 py-2 text-sm border border-neutral-200 rounded-lg disabled:opacity-40 hover:bg-neutral-50 transition-colors"
          >
            Suivant →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
