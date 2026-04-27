<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
const { apiFetch } = useAuth()
const { success: showToast } = useToast()
const { upload } = useImageUpload()
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl

const sections = ref<any[]>([])
const modal = reactive({ open: false, editing: null as any, form: { title: '', body: '', imageId: '', isPublished: true }, uploading: false })

onMounted(fetch)
async function fetch() {
  sections.value = await apiFetch<any[]>('/admin/home-sections')
}

function openModal(s?: any) {
  if (s) {
    modal.editing = s
    Object.assign(modal.form, { title: s.title, body: s.body, imageId: s.imageId ?? s.image?.id ?? '', isPublished: s.isPublished })
  } else {
    modal.editing = null
    Object.assign(modal.form, { title: '', body: '', imageId: '', isPublished: true })
  }
  modal.open = true
}

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  modal.uploading = true
  try {
    const r = await upload(file, 'HOMESECTION')
    modal.form.imageId = r.id
  } catch (err: any) { alert(err.message) }
  finally { modal.uploading = false }
}

async function submit() {
  const body = JSON.stringify(modal.form)
  if (modal.editing) {
    await apiFetch(`/admin/home-sections/${modal.editing.id}`, { method: 'PATCH', body } as any)
  } else {
    await apiFetch('/admin/home-sections', { method: 'POST', body } as any)
  }
  modal.open = false
  showToast('Section enregistrée')
  await fetch()
}

async function del(id: string) {
  if (!confirm('Supprimer ?')) return
  await apiFetch(`/admin/home-sections/${id}`, { method: 'DELETE' } as any)
  await fetch()
}

async function move(idx: number, delta: number) {
  const arr = [...sections.value]
  const [item] = arr.splice(idx, 1)
  arr.splice(idx + delta, 0, item)
  await apiFetch('/admin/home-sections/reorder', { method: 'PATCH', body: JSON.stringify({ ids: arr.map(s => s.id) }) } as any)
  sections.value = arr
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-neutral-900">Page d'accueil</h1>
      <button @click="openModal()" class="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">+ Ajouter une section</button>
    </div>

    <ul class="space-y-3">
      <li v-for="(s, i) in sections" :key="s.id" class="bg-white border border-neutral-100 rounded-xl p-4 flex items-center gap-4">
        <span class="text-neutral-400 text-sm w-8">#{{ i + 1 }}</span>
        <img v-if="s.image" :src="`${apiUrl}/images/${s.image.id}`" class="h-16 w-16 object-cover rounded" />
        <div v-else class="h-16 w-16 bg-neutral-100 rounded flex items-center justify-center text-neutral-300 text-xs">∅</div>
        <div class="flex-1 min-w-0">
          <p class="font-medium">{{ s.title }} <span v-if="!s.isPublished" class="text-xs text-neutral-400">(brouillon)</span></p>
          <p class="text-sm text-neutral-500 truncate">{{ s.body }}</p>
          <p class="text-xs text-neutral-400 mt-1">{{ i % 2 === 0 ? '↰ Image gauche' : '↱ Image droite' }}</p>
        </div>
        <div class="space-x-2 whitespace-nowrap">
          <button @click="openModal(s)" class="text-sm hover:text-primary-600">Modifier</button>
          <button @click="del(s.id)" class="text-sm text-red-700 hover:underline">Supprimer</button>
          <button v-if="i > 0" @click="move(i, -1)" class="text-sm text-neutral-400">↑</button>
          <button v-if="i < sections.length - 1" @click="move(i, 1)" class="text-sm text-neutral-400">↓</button>
        </div>
      </li>
    </ul>

    <Teleport to="body">
      <div v-if="modal.open" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
        <div class="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-semibold mb-4">{{ modal.editing ? 'Modifier' : 'Ajouter' }} une section</h3>
          <form @submit.prevent="submit" class="space-y-4">
            <div><label class="block text-sm mb-1">Titre</label>
              <input v-model="modal.form.title" required class="w-full px-3 py-2 border border-neutral-200 rounded-lg" /></div>
            <div><label class="block text-sm mb-1">Texte</label>
              <textarea v-model="modal.form.body" required rows="6" class="w-full px-3 py-2 border border-neutral-200 rounded-lg"></textarea></div>
            <div>
              <label class="block text-sm mb-1">Image</label>
              <div v-if="modal.form.imageId" class="mb-2">
                <img :src="`${apiUrl}/images/${modal.form.imageId}`" class="h-24 object-cover rounded" />
                <button type="button" @click="modal.form.imageId = ''" class="text-sm text-red-700 hover:underline">Retirer</button>
              </div>
              <input type="file" accept="image/*" @change="onFile" />
              <p v-if="modal.uploading" class="text-sm text-neutral-400 mt-1">Upload…</p>
            </div>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="modal.form.isPublished" type="checkbox" /> Publié
            </label>
            <div class="flex gap-2 justify-end">
              <button type="button" @click="modal.open = false" class="px-4 py-2 border border-neutral-200 rounded-lg">Annuler</button>
              <button type="submit" :disabled="modal.uploading" class="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
