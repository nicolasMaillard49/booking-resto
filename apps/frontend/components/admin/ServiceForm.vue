<script setup lang="ts">
const props = defineProps<{
  service?: {
    id: string; name: string; description: string | null; duration: number
    price: number; category: string | null; sortOrder: number; isActive: boolean
  } | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const { apiFetch } = useAuth()
const toast = useToast()

const form = reactive({
  name: props.service?.name || '',
  description: props.service?.description || '',
  duration: props.service?.duration || 60,
  price: props.service?.price || 0,
  category: props.service?.category || '',
  sortOrder: props.service?.sortOrder || 0,
})

const saving = ref(false)

async function save() {
  saving.value = true
  try {
    if (props.service) {
      await apiFetch(`/services/${props.service.id}`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      })
    } else {
      await apiFetch('/services', {
        method: 'POST',
        body: JSON.stringify(form),
      })
    }
    toast.success(props.service ? 'Service modifié' : 'Service créé')
    emit('saved')
  } catch {
    toast.error('Erreur lors de la sauvegarde')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <!-- Overlay modal -->
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="emit('close')">
    <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-neutral-900">
          {{ service ? 'Modifier le service' : 'Nouveau service' }}
        </h2>
        <button @click="emit('close')" class="text-neutral-400 hover:text-neutral-600 text-xl leading-none">✕</button>
      </div>

      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-1">Nom *</label>
          <input v-model="form.name" type="text" required maxlength="100" class="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-1">Description</label>
          <textarea v-model="form.description" rows="2" maxlength="1000" class="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1">Durée (min) *</label>
            <input v-model.number="form.duration" type="number" required min="5" max="480" class="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1">Prix (€) *</label>
            <input v-model.number="form.price" type="number" required min="0" step="0.5" class="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-1">Catégorie</label>
          <input v-model="form.category" type="text" maxlength="50" placeholder="ex: Coupes, Couleur, Soins..." class="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <div class="flex gap-3 pt-2">
          <button
            type="button"
            @click="emit('close')"
            class="flex-1 border border-neutral-200 text-neutral-700 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            {{ saving ? 'Sauvegarde...' : 'Sauvegarder' }}
          </button>
        </div>
      </form>
    </div>
  </div>
  <ToastContainer />
</template>
