<template>
  <div class="space-y-2">
    <!-- Aperçu sélection -->
    <div v-if="modelValue" class="flex items-center gap-3">
      <img :src="`${apiUrl}/images/${modelValue}`" class="h-20 w-20 object-cover rounded border border-neutral-200" />
      <div class="text-sm">
        <p class="text-neutral-700 font-mono text-xs truncate max-w-[240px]">{{ modelValue }}</p>
        <button type="button" @click="$emit('update:modelValue', '')" class="text-red-700 hover:underline">Retirer</button>
      </div>
    </div>

    <!-- Bouton upload + galerie existante -->
    <div class="flex flex-wrap gap-2 items-center">
      <label class="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs cursor-pointer hover:bg-primary-700">
        + Uploader
        <input type="file" :accept="accept" @change="onUpload" class="hidden" />
      </label>
      <button type="button" @click="open = !open" class="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs hover:bg-neutral-50">
        {{ open ? '× Fermer' : `📁 Choisir parmi ${images.length}` }}
      </button>
      <span v-if="uploading" class="text-xs text-neutral-500">Upload…</span>
    </div>

    <!-- Galerie -->
    <div v-if="open" class="grid grid-cols-4 gap-2 p-2 border border-neutral-200 rounded-lg max-h-64 overflow-y-auto bg-neutral-50">
      <button
        v-for="img in images"
        :key="img.id"
        type="button"
        @click="select(img.id)"
        :class="['aspect-square overflow-hidden rounded border-2 transition', modelValue === img.id ? 'border-primary-600 ring-2 ring-primary-200' : 'border-transparent hover:border-primary-400']"
      >
        <img :src="`${apiUrl}/images/${img.id}`" class="w-full h-full object-cover" />
      </button>
      <p v-if="!images.length" class="col-span-4 text-center text-xs text-neutral-400 py-4">Aucune image dans cette section. Uploade une première image.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  section: 'HERO' | 'HOMESECTION' | 'MENU' | 'OTHER'
  accept?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl
const { apiFetch } = useAuth()
const { upload } = useImageUpload()
const { error: showError } = useToast()

const images = ref<Array<{ id: string; mimeType: string }>>([])
const open = ref(false)
const uploading = ref(false)

const acceptAttr = computed(() => props.accept ?? 'image/*')

onMounted(fetch)

async function fetch() {
  try {
    images.value = await apiFetch<Array<{ id: string; mimeType: string }>>(`/admin/images?section=${props.section}`)
  } catch { /* silent */ }
}

function select(id: string) {
  emit('update:modelValue', id)
  open.value = false
}

async function onUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const r = await upload(file, props.section)
    emit('update:modelValue', r.id)
    await fetch()
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Erreur upload')
  } finally {
    uploading.value = false
  }
}
</script>
