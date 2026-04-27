<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
const { apiFetch } = useAuth()
const { success: showToast } = useToast()

const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const search = ref('')
const status = ref('')

let debounceTimer: any
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetch, 300)
}

async function fetch() {
  const params = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize) })
  if (status.value) params.set('status', status.value)
  if (search.value) params.set('search', search.value)
  const r = await apiFetch<{ items: any[]; total: number }>(`/admin/bookings?${params}`)
  items.value = r.items
  total.value = r.total
}

async function patch(id: string, newStatus: string) {
  if (!confirm(`Passer cette réservation en ${newStatus} ?`)) return
  await apiFetch(`/admin/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) } as any)
  showToast(`Réservation ${newStatus.toLowerCase()}`)
  await fetch()
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}
function badgeClass(s: string) {
  return ({
    PENDING:   'bg-amber-100 text-amber-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    NO_SHOW:   'bg-neutral-200 text-neutral-700',
  } as any)[s] ?? 'bg-neutral-100'
}

onMounted(fetch)
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-neutral-900 mb-6">Réservations</h1>

    <AdminWeekAgendaCard />

    <div class="bg-white border border-neutral-100 rounded-xl overflow-hidden">
      <div class="p-4 border-b border-neutral-100 flex gap-3 flex-wrap">
        <input v-model="search" @input="debouncedFetch" placeholder="Recherche nom/email/tél" class="px-3 py-2 border border-neutral-200 rounded-lg text-sm flex-1 min-w-[200px]" />
        <select v-model="status" @change="fetch" class="px-3 py-2 border border-neutral-200 rounded-lg text-sm">
          <option value="">Tous statuts</option>
          <option value="PENDING">En attente</option>
          <option value="CONFIRMED">Confirmé</option>
          <option value="CANCELLED">Annulé</option>
          <option value="COMPLETED">Terminé</option>
          <option value="NO_SHOW">No-show</option>
        </select>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th class="p-3">Date</th><th class="p-3">Service</th><th class="p-3">Couv.</th><th class="p-3">Client</th><th class="p-3">Tél</th><th class="p-3">Statut</th><th class="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in items" :key="b.id" class="border-t border-neutral-100">
              <td class="p-3 whitespace-nowrap">{{ formatDateTime(b.date) }}</td>
              <td class="p-3 text-xs text-neutral-500">{{ b.serviceWindow?.label ?? '—' }}</td>
              <td class="p-3 font-medium">{{ b.partySize }}</td>
              <td class="p-3">{{ b.clientName }}<br><span class="text-xs text-neutral-400">{{ b.clientEmail }}</span></td>
              <td class="p-3 text-xs">{{ b.clientPhone }}</td>
              <td class="p-3"><span :class="badgeClass(b.status)" class="px-2 py-0.5 rounded text-xs">{{ b.status }}</span></td>
              <td class="p-3 space-x-2 whitespace-nowrap">
                <button v-if="b.status === 'PENDING'" @click="patch(b.id, 'CONFIRMED')" class="text-xs text-green-700 hover:underline">Confirmer</button>
                <button v-if="b.status !== 'CANCELLED'" @click="patch(b.id, 'CANCELLED')" class="text-xs text-red-700 hover:underline">Annuler</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!items.length" class="p-6 text-center text-neutral-400">Aucune réservation</p>
      <div class="p-4 border-t border-neutral-100 flex justify-between text-sm">
        <span>{{ total }} résultat{{ total > 1 ? 's' : '' }}</span>
        <div class="space-x-2">
          <button :disabled="page <= 1" @click="page--; fetch()" class="px-2 py-1 border border-neutral-200 rounded disabled:opacity-50">‹</button>
          <button :disabled="page * pageSize >= total" @click="page++; fetch()" class="px-2 py-1 border border-neutral-200 rounded disabled:opacity-50">›</button>
        </div>
      </div>
    </div>
  </div>
</template>
