<script setup lang="ts">
import { Scissors, Pencil, Trash2 } from 'lucide-vue-next'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { apiFetch } = useAuth()
const toast = useToast()

interface Service {
  id: string; name: string; description: string | null; duration: number
  price: number; category: string | null; isActive: boolean; sortOrder: number
}

const services = ref<Service[]>([])
const loading = ref(true)
const showForm = ref(false)
const editingService = ref<Service | null>(null)

async function loadServices() {
  try {
    services.value = await apiFetch<Service[]>('/services')
  } catch {
    toast.error('Erreur chargement services')
  } finally {
    loading.value = false
  }
}

async function deleteService(id: string) {
  if (!confirm('Désactiver ce service ?')) return
  try {
    await apiFetch(`/services/${id}`, { method: 'DELETE' })
    await loadServices()
    toast.success('Service désactivé')
  } catch {
    toast.error('Erreur')
  }
}

onMounted(loadServices)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-neutral-900">Services</h1>
      <button
        @click="editingService = null; showForm = true"
        class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        + Nouveau service
      </button>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-20 bg-white rounded-xl animate-pulse" />
    </div>

    <div v-else-if="!services.length" class="text-center py-12 text-neutral-400">
      <Scissors :size="40" :stroke-width="1.4" class="mx-auto mb-3 text-neutral-300" />
      <p>Aucun service. Créez le premier !</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="service in services"
        :key="service.id"
        class="bg-white rounded-xl border border-neutral-100 p-5 flex items-center justify-between"
      >
        <div>
          <div class="flex items-center gap-2">
            <p class="font-semibold text-neutral-800">{{ service.name }}</p>
            <span v-if="!service.isActive" class="text-xs bg-neutral-100 text-neutral-400 px-2 py-0.5 rounded-full">Inactif</span>
          </div>
          <p class="text-sm text-neutral-500 mt-0.5">{{ service.duration }} min · {{ service.price }} € · {{ service.category || 'Sans catégorie' }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="editingService = service; showForm = true"
            class="p-2 hover:bg-neutral-50 rounded-lg transition-colors text-neutral-500 hover:text-neutral-800"
          >
            <Pencil :size="16" :stroke-width="2" />
          </button>
          <button
            @click="deleteService(service.id)"
            class="p-2 hover:bg-red-50 rounded-lg transition-colors text-neutral-500 hover:text-red-600"
          >
            <Trash2 :size="16" :stroke-width="2" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal formulaire -->
    <AdminServiceForm
      v-if="showForm"
      :service="editingService"
      @close="showForm = false"
      @saved="showForm = false; loadServices()"
    />

    <ToastContainer />
  </div>
</template>
