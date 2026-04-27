<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
const { apiFetch } = useAuth()
const { success: showToast, error: showError } = useToast()
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl

const popups = ref<any[]>([])
const modal = reactive({
  open: false,
  editing: null as any,
  form: {
    title: '',
    body: '',
    imageId: '',
    ctaLabel: '',
    ctaUrl: '',
    isActive: true,
    trigger: 'ON_LOAD' as 'ON_LOAD' | 'AFTER_DELAY',
    delaySeconds: 3,
    showOncePerSession: true,
    startDate: '',
    endDate: '',
  },
})

onMounted(fetch)
async function fetch() {
  popups.value = await apiFetch<any[]>('/admin/popups')
}

function openModal(p?: any) {
  if (p) {
    modal.editing = p
    Object.assign(modal.form, {
      title: p.title,
      body: p.body,
      imageId: p.imageId ?? p.image?.id ?? '',
      ctaLabel: p.ctaLabel ?? '',
      ctaUrl: p.ctaUrl ?? '',
      isActive: p.isActive,
      trigger: p.trigger ?? 'ON_LOAD',
      delaySeconds: p.delaySeconds ?? 3,
      showOncePerSession: p.showOncePerSession ?? true,
      startDate: p.startDate ? p.startDate.slice(0, 10) : '',
      endDate: p.endDate ? p.endDate.slice(0, 10) : '',
    })
  } else {
    modal.editing = null
    Object.assign(modal.form, {
      title: '', body: '', imageId: '', ctaLabel: '', ctaUrl: '',
      isActive: true, trigger: 'ON_LOAD', delaySeconds: 3,
      showOncePerSession: true, startDate: '', endDate: '',
    })
  }
  modal.open = true
}

async function submit() {
  const body: any = { ...modal.form }
  if (!body.imageId) delete body.imageId
  if (!body.ctaLabel) delete body.ctaLabel
  if (!body.ctaUrl) delete body.ctaUrl
  if (!body.startDate) delete body.startDate
  if (!body.endDate) delete body.endDate
  try {
    if (modal.editing) {
      await apiFetch(`/admin/popups/${modal.editing.id}`, { method: 'PATCH', body })
    } else {
      await apiFetch('/admin/popups', { method: 'POST', body })
    }
    modal.open = false
    showToast('Popup enregistrée')
    await fetch()
  } catch (e) { showError(extractError(e)) }
}

async function del(id: string) {
  if (!confirm('Supprimer cette popup ?')) return
  try {
    await apiFetch(`/admin/popups/${id}`, { method: 'DELETE' })
    await fetch()
    showToast('Popup supprimée')
  } catch (e) { showError(extractError(e)) }
}

async function toggleActive(p: any) {
  try {
    await apiFetch(`/admin/popups/${p.id}`, { method: 'PATCH', body: { isActive: !p.isActive } })
    await fetch()
    showToast(!p.isActive ? 'Popup activée' : 'Popup désactivée')
  } catch (e) { showError(extractError(e)) }
}

function extractError(e: unknown): string {
  if (e && typeof e === 'object' && 'data' in e) {
    const data = (e as { data?: { message?: string } }).data
    return data?.message ?? 'Erreur inconnue'
  }
  return e instanceof Error ? e.message : 'Erreur inconnue'
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-neutral-900">Popups & événements</h1>
      <button @click="openModal()" class="px-4 py-2 bg-primary-600 text-white text-sm hover:bg-primary-700">+ Nouvelle popup</button>
    </div>

    <p class="text-sm text-neutral-500 mb-4">Crée des popups personnalisables (événements, annonces, promotions). Une seule popup active à la fois est affichée sur le site public.</p>

    <ul class="space-y-3">
      <li v-for="p in popups" :key="p.id" class="bg-white border border-neutral-100 p-4 flex items-start gap-4">
        <img v-if="p.image" :src="`${apiUrl}/images/${p.image.id}`" class="h-20 w-20 object-cover" />
        <div v-else class="h-20 w-20 bg-neutral-100 flex items-center justify-center text-neutral-300 text-xs">∅</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="font-medium">{{ p.title }}</p>
            <span v-if="p.isActive" class="text-xs px-2 py-0.5 bg-green-100 text-green-800">Active</span>
            <span v-else class="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-500">Inactive</span>
            <span class="text-xs text-neutral-400">{{ p.trigger === 'AFTER_DELAY' ? `Après ${p.delaySeconds}s` : 'Au chargement' }}</span>
          </div>
          <p v-if="p.startDate || p.endDate" class="text-xs text-neutral-400 mt-1">
            {{ p.startDate ? `Du ${new Date(p.startDate).toLocaleDateString('fr-FR')}` : '' }}
            {{ p.endDate ? `au ${new Date(p.endDate).toLocaleDateString('fr-FR')}` : '' }}
          </p>
        </div>
        <div class="space-x-2 whitespace-nowrap">
          <button @click="toggleActive(p)" class="text-sm" :class="p.isActive ? 'text-amber-700 hover:underline' : 'text-green-700 hover:underline'">
            {{ p.isActive ? 'Désactiver' : 'Activer' }}
          </button>
          <button @click="openModal(p)" class="text-sm hover:text-primary-600">Modifier</button>
          <button @click="del(p.id)" class="text-sm text-red-700 hover:underline">Supprimer</button>
        </div>
      </li>
    </ul>
    <p v-if="!popups.length" class="text-center text-neutral-400 py-12">Aucune popup créée pour le moment</p>

    <!-- Modal édition -->
    <Teleport to="body">
      <div v-if="modal.open" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6 overflow-y-auto">
        <div class="bg-white p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-semibold mb-4">{{ modal.editing ? 'Modifier' : 'Créer' }} une popup</h3>
          <form @submit.prevent="submit" class="space-y-4">
            <div><label class="block text-sm mb-1">Titre</label>
              <input v-model="modal.form.title" required class="w-full px-3 py-2 border border-neutral-200" /></div>
            <div><label class="block text-sm mb-1">Texte (gras, italique, listes…)</label>
              <AdminRichTextEditor v-model="modal.form.body" min-height="160px" /></div>
            <div>
              <label class="block text-sm mb-2">Image (optionnelle)</label>
              <AdminImagePicker v-model="modal.form.imageId" section="OTHER" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm mb-1">Bouton (libellé)</label>
                <input v-model="modal.form.ctaLabel" placeholder="Ex : En savoir plus" class="w-full px-3 py-2 border border-neutral-200" />
              </div>
              <div>
                <label class="block text-sm mb-1">Bouton (URL)</label>
                <input v-model="modal.form.ctaUrl" placeholder="/menu ou https://…" class="w-full px-3 py-2 border border-neutral-200" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm mb-1">Déclenchement</label>
                <select v-model="modal.form.trigger" class="w-full px-3 py-2 border border-neutral-200">
                  <option value="ON_LOAD">Au chargement de la page</option>
                  <option value="AFTER_DELAY">Après un délai</option>
                </select>
              </div>
              <div v-if="modal.form.trigger === 'AFTER_DELAY'">
                <label class="block text-sm mb-1">Délai (secondes)</label>
                <input v-model.number="modal.form.delaySeconds" type="number" min="0" class="w-full px-3 py-2 border border-neutral-200" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm mb-1">Date début (optionnelle)</label>
                <input v-model="modal.form.startDate" type="date" class="w-full px-3 py-2 border border-neutral-200" />
              </div>
              <div>
                <label class="block text-sm mb-1">Date fin (optionnelle)</label>
                <input v-model="modal.form.endDate" type="date" class="w-full px-3 py-2 border border-neutral-200" />
              </div>
            </div>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="modal.form.showOncePerSession" type="checkbox" /> Afficher une seule fois par visite
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="modal.form.isActive" type="checkbox" /> Active (visible sur le site)
            </label>
            <div class="flex gap-2 justify-end">
              <button type="button" @click="modal.open = false" class="px-4 py-2 border border-neutral-200">Annuler</button>
              <button type="submit" class="px-4 py-2 bg-primary-600 text-white">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
