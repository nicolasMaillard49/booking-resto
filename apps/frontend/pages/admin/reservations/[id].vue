<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const { apiFetch } = useAuth()
const toast = useToast()
const id = route.params.id as string

interface BookingDetail {
  id: string; clientName: string; clientEmail: string; clientPhone: string
  date: string; duration: number; status: string; notes: string | null
  amount: number | null; paymentStatus: string; cancelToken: string
  confirmedAt: string | null; cancelledAt: string | null; createdAt: string
  service: { id: string; name: string; duration: number; price: number }
  business: { name: string; email: string }
}

const booking = ref<BookingDetail | null>(null)
const loading = ref(true)
const updating = ref(false)
const newStatus = ref('')
const adminNote = ref('')

onMounted(async () => {
  try {
    booking.value = await apiFetch<BookingDetail>(`/bookings/${id}`)
    newStatus.value = booking.value.status
    adminNote.value = booking.value.notes || ''
  } catch {
    toast.error('Réservation introuvable')
    navigateTo('/admin/reservations')
  } finally {
    loading.value = false
  }
})

async function updateStatus() {
  if (!booking.value) return
  updating.value = true
  try {
    await apiFetch(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus.value, notes: adminNote.value }),
    })
    booking.value.status = newStatus.value
    booking.value.notes = adminNote.value
    toast.success('Réservation mise à jour')
  } catch {
    toast.error('Erreur lors de la mise à jour')
  } finally {
    updating.value = false
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/admin/reservations" class="text-neutral-400 hover:text-neutral-600">← Retour</NuxtLink>
      <h1 class="text-2xl font-bold text-neutral-900">Détail réservation</h1>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-24 bg-white rounded-xl animate-pulse" />
    </div>

    <div v-else-if="booking" class="grid lg:grid-cols-3 gap-6">
      <!-- Infos principales -->
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-white rounded-xl border border-neutral-100 p-6">
          <h2 class="font-semibold text-neutral-900 mb-4">Informations client</h2>
          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div><dt class="text-neutral-400">Nom</dt><dd class="font-medium mt-0.5">{{ booking.clientName }}</dd></div>
            <div><dt class="text-neutral-400">Email</dt><dd class="font-medium mt-0.5">{{ booking.clientEmail }}</dd></div>
            <div><dt class="text-neutral-400">Téléphone</dt><dd class="font-medium mt-0.5">{{ booking.clientPhone }}</dd></div>
            <div><dt class="text-neutral-400">RDV créé le</dt><dd class="font-medium mt-0.5">{{ new Date(booking.createdAt).toLocaleDateString('fr-FR') }}</dd></div>
          </dl>
        </div>

        <div class="bg-white rounded-xl border border-neutral-100 p-6">
          <h2 class="font-semibold text-neutral-900 mb-4">Rendez-vous</h2>
          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div><dt class="text-neutral-400">Prestation</dt><dd class="font-medium mt-0.5">{{ booking.service.name }}</dd></div>
            <div><dt class="text-neutral-400">Durée</dt><dd class="font-medium mt-0.5">{{ booking.duration }} min</dd></div>
            <div><dt class="text-neutral-400">Date</dt><dd class="font-medium mt-0.5">{{ formatDate(booking.date) }}</dd></div>
            <div><dt class="text-neutral-400">Prix</dt><dd class="font-medium mt-0.5">{{ booking.service.price }} €</dd></div>
          </dl>

          <div v-if="booking.notes" class="mt-4 bg-yellow-50 rounded-lg p-3">
            <p class="text-xs text-yellow-600 font-medium mb-1">Note client:</p>
            <p class="text-sm text-neutral-700">{{ booking.notes }}</p>
          </div>
        </div>
      </div>

      <!-- Actions admin -->
      <div class="space-y-4">
        <div class="bg-white rounded-xl border border-neutral-100 p-6">
          <h2 class="font-semibold text-neutral-900 mb-4">Actions</h2>

          <div class="mb-4">
            <p class="text-sm text-neutral-400 mb-2">Statut actuel</p>
            <AdminStatusBadge :status="booking.status" />
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-neutral-700 mb-1">Changer le statut</label>
            <select
              v-model="newStatus"
              class="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="PENDING">En attente</option>
              <option value="CONFIRMED">Confirmé</option>
              <option value="CANCELLED">Annulé</option>
              <option value="COMPLETED">Complété</option>
              <option value="NO_SHOW">Absent</option>
            </select>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-neutral-700 mb-1">Note admin</label>
            <textarea
              v-model="adminNote"
              rows="3"
              class="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Note interne..."
            />
          </div>

          <button
            @click="updateStatus"
            :disabled="updating"
            class="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {{ updating ? 'Mise à jour...' : 'Sauvegarder' }}
          </button>
        </div>
      </div>
    </div>

    <ToastContainer />
  </div>
</template>
