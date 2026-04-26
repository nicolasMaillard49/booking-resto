<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
const { apiFetch } = useAuth()
const { upload } = useImageUpload()
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl

const filter = ref('HOMESECTION')
const items = ref<any[]>([])

onMounted(fetch)
async function fetch() {
  items.value = await apiFetch<any[]>(`/admin/images?section=${filter.value}`)
}

async function onUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try { await upload(file, filter.value); await fetch() }
  catch (err: any) { alert(err.message) }
}

async function del(id: string) {
  if (!confirm('Supprimer ?')) return
  try { await apiFetch(`/admin/images/${id}`, { method: 'DELETE' } as any); await fetch() }
  catch (e: any) { alert(e?.data?.message ?? 'Erreur') }
}

function formatSize(b: number) { return `${(b / 1024).toFixed(1)} Ko` }
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6 gap-3 flex-wrap">
      <h1 class="text-2xl font-bold text-neutral-900">Images & Fichiers</h1>
      <div class="flex gap-2">
        <select v-model="filter" @change="fetch" class="px-3 py-2 border border-neutral-200 rounded-lg text-sm">
          <option value="HERO">Hero</option>
          <option value="HOMESECTION">Sections home</option>
          <option value="MENU">Menu</option>
          <option value="OTHER">Autre</option>
        </select>
        <label class="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm cursor-pointer hover:bg-primary-700">
          + Upload
          <input type="file" accept="image/*,application/pdf" @change="onUpload" class="hidden" />
        </label>
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="img in items" :key="img.id" class="bg-white border border-neutral-100 rounded-xl p-3">
        <div class="aspect-square flex items-center justify-center bg-neutral-100 rounded mb-2">
          <span v-if="img.mimeType === 'application/pdf'" class="text-4xl">📄</span>
          <img v-else :src="`${apiUrl}/images/${img.id}`" class="w-full h-full object-cover rounded" />
        </div>
        <p class="text-xs text-neutral-500 truncate">{{ img.mimeType }} · {{ formatSize(img.size) }}</p>
        <button @click="del(img.id)" class="mt-1 text-xs text-red-700 hover:underline">Supprimer</button>
      </div>
    </div>
    <p v-if="!items.length" class="text-center text-neutral-400 py-12">Aucun fichier dans cette section</p>
  </div>
</template>
