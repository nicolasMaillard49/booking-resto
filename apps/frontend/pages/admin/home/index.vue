<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
const { apiFetch } = useAuth()
const { success: showToast, error: showError } = useToast()
const { upload } = useImageUpload()
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl

const sections = ref<any[]>([])
const modal = reactive({
  open: false,
  editing: null as any,
  form: {
    title: '', body: '', imageId: '', layout: 'SPLIT' as 'SPLIT' | 'FULL',
    bgColor: '', ctaLabel: '', ctaUrl: '', isPublished: true,
    translations: {
      en: { title: '', body: '', ctaLabel: '' },
      es: { title: '', body: '', ctaLabel: '' },
      it: { title: '', body: '', ctaLabel: '' },
      de: { title: '', body: '', ctaLabel: '' },
    } as Record<string, { title: string; body: string; ctaLabel: string }>,
  },
  uploading: false,
  activeLang: 'fr' as 'fr' | 'en' | 'es' | 'it' | 'de',
})

const TRANSLATABLE_LANGS = [
  { code: 'fr', label: '🇫🇷 Français (source)' },
  { code: 'en', label: '🇬🇧 English' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'it', label: '🇮🇹 Italiano' },
  { code: 'de', label: '🇩🇪 Deutsch' },
] as const

onMounted(fetch)
async function fetch() {
  sections.value = await apiFetch<any[]>('/admin/home-sections')
}

function emptyTranslations() {
  return {
    en: { title: '', body: '', ctaLabel: '' },
    es: { title: '', body: '', ctaLabel: '' },
    it: { title: '', body: '', ctaLabel: '' },
    de: { title: '', body: '', ctaLabel: '' },
  }
}

function openModal(s?: any) {
  modal.activeLang = 'fr'
  if (s) {
    modal.editing = s
    const trans = emptyTranslations()
    if (s.translations) {
      for (const k of ['en','es','it','de'] as const) {
        if (s.translations[k]) Object.assign(trans[k], s.translations[k])
      }
    }
    Object.assign(modal.form, {
      title: s.title, body: s.body,
      imageId: s.imageId ?? s.image?.id ?? '',
      layout: s.layout ?? 'SPLIT',
      bgColor: s.bgColor ?? '',
      ctaLabel: s.ctaLabel ?? '',
      ctaUrl: s.ctaUrl ?? '',
      isPublished: s.isPublished,
      translations: trans,
    })
  } else {
    modal.editing = null
    Object.assign(modal.form, {
      title: '', body: '', imageId: '', layout: 'SPLIT',
      bgColor: '', ctaLabel: '', ctaUrl: '', isPublished: true,
      translations: emptyTranslations(),
    })
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
  } catch (err) { showError(extractError(err)) }
  finally { modal.uploading = false }
}

async function submit() {
  const body: any = { ...modal.form }
  if (!body.bgColor) delete body.bgColor
  if (!body.ctaLabel) delete body.ctaLabel
  if (!body.ctaUrl) delete body.ctaUrl
  // Strip translations dont tous les champs sont vides → null
  const cleaned: Record<string, any> = {}
  for (const [code, t] of Object.entries(body.translations as Record<string, any>)) {
    const tt = t as { title: string; body: string; ctaLabel: string }
    if (tt.title || tt.body || tt.ctaLabel) {
      const o: any = {}
      if (tt.title) o.title = tt.title
      if (tt.body) o.body = tt.body
      if (tt.ctaLabel) o.ctaLabel = tt.ctaLabel
      cleaned[code] = o
    }
  }
  body.translations = Object.keys(cleaned).length ? cleaned : null
  try {
    if (modal.editing) {
      await apiFetch(`/admin/home-sections/${modal.editing.id}`, { method: 'PATCH', body })
    } else {
      await apiFetch('/admin/home-sections', { method: 'POST', body })
    }
    modal.open = false
    showToast('Section enregistrée')
    await fetch()
  } catch (e) { showError(extractError(e)) }
}

async function del(id: string) {
  if (!confirm('Supprimer ?')) return
  try {
    await apiFetch(`/admin/home-sections/${id}`, { method: 'DELETE' })
    await fetch()
    showToast('Section supprimée')
  } catch (e) { showError(extractError(e)) }
}

async function move(idx: number, delta: number) {
  const arr = [...sections.value]
  const [item] = arr.splice(idx, 1)
  arr.splice(idx + delta, 0, item)
  try {
    await apiFetch('/admin/home-sections/reorder', { method: 'PATCH', body: { ids: arr.map(s => s.id) } })
    sections.value = arr
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
      <h1 class="text-2xl font-bold text-neutral-900">Page d'accueil</h1>
      <button @click="openModal()" class="px-4 py-2 bg-primary-600 text-white text-sm hover:bg-primary-700">+ Ajouter une section</button>
    </div>

    <ul class="space-y-3">
      <li v-for="(s, i) in sections" :key="s.id" class="bg-white border border-neutral-100 p-4 flex items-center gap-4">
        <span class="text-neutral-400 text-sm w-8">#{{ i + 1 }}</span>
        <img v-if="s.image" :src="`${apiUrl}/images/${s.image.id}`" class="h-16 w-16 object-cover" />
        <div v-else class="h-16 w-16 bg-neutral-100 flex items-center justify-center text-neutral-300 text-xs">∅</div>
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
        <div class="bg-white p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-semibold mb-4">{{ modal.editing ? 'Modifier' : 'Ajouter' }} une section</h3>
          <form @submit.prevent="submit" class="space-y-4">
            <div>
              <label class="block text-sm mb-2">Type de section</label>
              <div class="flex gap-2">
                <button type="button" @click="modal.form.layout = 'SPLIT'"
                  :class="['flex-1 px-3 py-2 border text-sm', modal.form.layout === 'SPLIT' ? 'bg-primary-600 text-white border-primary-600' : 'border-neutral-200']">
                  Split (image + texte côte à côte)
                </button>
                <button type="button" @click="modal.form.layout = 'FULL'"
                  :class="['flex-1 px-3 py-2 border text-sm', modal.form.layout === 'FULL' ? 'bg-primary-600 text-white border-primary-600' : 'border-neutral-200']">
                  Pleine largeur (texte centré + CTA)
                </button>
              </div>
            </div>
            <!-- Tabs langues -->
            <div class="border-b border-neutral-200 flex gap-1 overflow-x-auto">
              <button
                v-for="lang in TRANSLATABLE_LANGS"
                :key="lang.code"
                type="button"
                @click="modal.activeLang = lang.code as any"
                :class="['px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition',
                         modal.activeLang === lang.code
                           ? 'border-primary-600 text-primary-700 font-semibold'
                           : 'border-transparent text-neutral-500 hover:text-neutral-700']"
              >
                {{ lang.label }}
              </button>
            </div>

            <!-- Champs traduits dynamiquement -->
            <template v-if="modal.activeLang === 'fr'">
              <div><label class="block text-sm mb-1">Titre <span class="text-xs text-neutral-400">(version par défaut)</span></label>
                <input v-model="modal.form.title" required class="w-full px-3 py-2 border border-neutral-200" /></div>
              <div><label class="block text-sm mb-1">Texte</label>
                <AdminRichTextEditor v-model="modal.form.body" min-height="200px" /></div>
            </template>
            <template v-else>
              <div><label class="block text-sm mb-1">Titre traduit ({{ modal.activeLang.toUpperCase() }}) <span class="text-xs text-neutral-400">— laisse vide pour garder la version FR</span></label>
                <input v-model="modal.form.translations[modal.activeLang].title" :placeholder="modal.form.title" class="w-full px-3 py-2 border border-neutral-200" /></div>
              <div><label class="block text-sm mb-1">Texte traduit ({{ modal.activeLang.toUpperCase() }})</label>
                <AdminRichTextEditor v-model="modal.form.translations[modal.activeLang].body" min-height="200px" /></div>
              <div><label class="block text-sm mb-1">Bouton traduit ({{ modal.activeLang.toUpperCase() }})</label>
                <input v-model="modal.form.translations[modal.activeLang].ctaLabel" :placeholder="modal.form.ctaLabel" class="w-full px-3 py-2 border border-neutral-200" /></div>
            </template>
            <div>
              <label class="block text-sm mb-2">{{ modal.form.layout === 'FULL' ? 'Image de fond (optionnelle, filtre sombre auto)' : 'Image' }}</label>
              <AdminImagePicker v-model="modal.form.imageId" :section="modal.form.layout === 'FULL' ? 'OTHER' : 'HOMESECTION'" />
            </div>
            <div>
              <label class="block text-sm mb-1">Couleur de fond <span class="text-xs text-neutral-400">(laisser vide pour la couleur par défaut #f5f5f5)</span></label>
              <div class="flex gap-2 items-center">
                <input
                  type="color"
                  :value="modal.form.bgColor || '#f5f5f5'"
                  @input="modal.form.bgColor = ($event.target as HTMLInputElement).value"
                  class="w-12 h-10 border border-neutral-200 cursor-pointer p-0"
                />
                <input v-model="modal.form.bgColor" placeholder="#f5f5f5" class="flex-1 px-3 py-2 border border-neutral-200 font-mono text-sm" />
                <button v-if="modal.form.bgColor" type="button" @click="modal.form.bgColor = ''" class="px-3 py-2 border border-neutral-200 text-xs hover:bg-neutral-50">Réinitialiser</button>
              </div>
              <div class="mt-2 flex gap-1.5 flex-wrap">
                <button v-for="c in ['#f5f5f5','#ffffff','#1f1f1f','#111111','#c39d63','#fef9e7','#e8f0e8']" :key="c"
                  type="button"
                  @click="modal.form.bgColor = c"
                  class="w-7 h-7 border border-neutral-200 hover:scale-110 transition"
                  :style="{ backgroundColor: c }"
                  :title="c"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm mb-1">Bouton (libellé) <span class="text-xs text-neutral-400">optionnel</span></label>
                <input v-model="modal.form.ctaLabel" placeholder="Ex : Voir le menu" class="w-full px-3 py-2 border border-neutral-200" />
              </div>
              <div>
                <label class="block text-sm mb-1">Bouton (URL)</label>
                <input v-model="modal.form.ctaUrl" placeholder="/menu ou https://…" class="w-full px-3 py-2 border border-neutral-200" />
              </div>
            </div>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="modal.form.isPublished" type="checkbox" /> Publié
            </label>
            <div class="flex gap-2 justify-end">
              <button type="button" @click="modal.open = false" class="px-4 py-2 border border-neutral-200">Annuler</button>
              <button type="submit" :disabled="modal.uploading" class="px-4 py-2 bg-primary-600 text-white disabled:opacity-50">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
