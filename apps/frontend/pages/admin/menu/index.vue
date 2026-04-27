<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
const { apiFetch } = useAuth()
const { success: showToast, error: showError } = useToast()
const { upload } = useImageUpload()
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl

const docs = ref<any[]>([])
const modal = reactive({ open: false, editing: null as any, form: { title: '', description: '', fileId: '', isPublished: true }, uploading: false, convertPdf: true })

onMounted(fetch)
async function fetch() {
  docs.value = await apiFetch<any[]>('/admin/menu-documents')
}

function openModal(d?: any) {
  if (d) {
    modal.editing = d
    Object.assign(modal.form, { title: d.title, description: d.description ?? '', fileId: d.fileId ?? d.file?.id ?? '', isPublished: d.isPublished })
  } else {
    modal.editing = null
    Object.assign(modal.form, { title: '', description: '', fileId: '', isPublished: true })
  }
  modal.open = true
}

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  modal.uploading = true
  try {
    const r = await upload(file, 'MENU', { convertPdf: modal.convertPdf })
    modal.form.fileId = r.id
  } catch (err) { showError(extractError(err)) }
  finally { modal.uploading = false }
}

async function submit() {
  const body = { ...modal.form }
  try {
    if (modal.editing) {
      await apiFetch(`/admin/menu-documents/${modal.editing.id}`, { method: 'PATCH', body })
    } else {
      await apiFetch('/admin/menu-documents', { method: 'POST', body })
    }
    modal.open = false
    showToast('Menu enregistré')
    await fetch()
  } catch (e) { showError(extractError(e)) }
}

async function del(id: string) {
  if (!confirm('Supprimer ?')) return
  try {
    await apiFetch(`/admin/menu-documents/${id}`, { method: 'DELETE' })
    await fetch()
    showToast('Menu supprimé')
  } catch (e) { showError(extractError(e)) }
}

async function move(idx: number, delta: number) {
  const arr = [...docs.value]
  const [item] = arr.splice(idx, 1)
  arr.splice(idx + delta, 0, item)
  try {
    await apiFetch('/admin/menu-documents/reorder', { method: 'PATCH', body: { ids: arr.map(d => d.id) } })
    docs.value = arr
    showToast('Ordre modifié')
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
      <h1 class="text-2xl font-bold text-neutral-900">Menu</h1>
      <button @click="openModal()" class="px-4 py-2 bg-primary-600 text-white text-sm hover:bg-primary-700">+ Ajouter un menu</button>
    </div>

    <ul class="space-y-3">
      <li v-for="(d, i) in docs" :key="d.id" class="bg-white border border-neutral-100 p-4 flex items-center gap-4">
        <span class="text-neutral-400 text-sm w-8">#{{ i + 1 }}</span>
        <div class="h-16 w-16 bg-neutral-100 flex items-center justify-center text-2xl">
          {{ d.file.mimeType === 'application/pdf' ? '📄' : '🖼️' }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-medium">{{ d.title }} <span v-if="!d.isPublished" class="text-xs text-neutral-400">(brouillon)</span></p>
          <p class="text-sm text-neutral-500 truncate">{{ d.description || '—' }}</p>
          <p class="text-xs text-neutral-400 mt-1">{{ d.file.mimeType }} · {{ Math.round(d.file.size / 1024) }} Ko</p>
        </div>
        <div class="space-x-2 whitespace-nowrap">
          <button @click="openModal(d)" class="text-sm hover:text-primary-600">Modifier</button>
          <button @click="del(d.id)" class="text-sm text-red-700 hover:underline">Supprimer</button>
          <button v-if="i > 0" @click="move(i, -1)" class="text-sm text-neutral-400">↑</button>
          <button v-if="i < docs.length - 1" @click="move(i, 1)" class="text-sm text-neutral-400">↓</button>
        </div>
      </li>
    </ul>
    <p v-if="!docs.length" class="text-center text-neutral-400 py-12">Aucun menu publié</p>

    <Teleport to="body">
      <div v-if="modal.open" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
        <div class="bg-white p-6 max-w-xl w-full">
          <h3 class="text-lg font-semibold mb-4">{{ modal.editing ? 'Modifier' : 'Ajouter' }} un menu</h3>
          <form @submit.prevent="submit" class="space-y-4">
            <div><label class="block text-sm mb-1">Titre</label>
              <input v-model="modal.form.title" required class="w-full px-3 py-2 border border-neutral-200" /></div>
            <div><label class="block text-sm mb-1">Description (gras, italique, listes…)</label>
              <AdminRichTextEditor v-model="modal.form.description" min-height="120px" /></div>
            <div>
              <label class="block text-sm mb-1">Fichier (image ou PDF, max 10 Mo)</label>
              <label class="flex items-start gap-2 text-xs text-neutral-600 mb-2 cursor-pointer">
                <input v-model="modal.convertPdf" type="checkbox" class="mt-0.5" />
                <span>
                  <strong>Convertir le PDF en image</strong> (recommandé pour un rendu sans bordures, mais le fichier est plus lourd).
                  Décoche pour stocker le PDF tel quel (plus léger, mais le viewer natif affiche un encadré).
                </span>
              </label>
              <div v-if="modal.form.fileId" class="mb-2 text-sm">
                Fichier uploadé ✓ <button type="button" @click="modal.form.fileId = ''" class="text-red-700 hover:underline">Changer</button>
              </div>
              <input v-else type="file" accept="image/*,application/pdf" required @change="onFile" />
              <p v-if="modal.uploading" class="text-sm text-neutral-400 mt-1">{{ modal.convertPdf ? 'Conversion + upload…' : 'Upload…' }}</p>
            </div>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="modal.form.isPublished" type="checkbox" /> Publié
            </label>
            <div class="flex gap-2 justify-end">
              <button type="button" @click="modal.open = false" class="px-4 py-2 border border-neutral-200">Annuler</button>
              <button type="submit" :disabled="modal.uploading || !modal.form.fileId" class="px-4 py-2 bg-primary-600 text-white disabled:opacity-50">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
