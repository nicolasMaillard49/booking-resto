<template>
  <div class="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-32 lg:pt-40 pb-20 lg:pb-28">
    <h1 class="font-display text-3xl sm:text-4xl lg:text-5xl text-center mb-6 tracking-extra-wide leading-tight" style="color: #111111;">
      {{ site.menu_page_title || 'Nos menus' }}
    </h1>
    <div
      v-if="site.menu_page_description"
      class="rt-output text-center max-w-3xl mx-auto mb-16 lg:mb-20 leading-relaxed tracking-wide"
      style="color: #111111; font-size: 14px;"
      v-html="site.menu_page_description"
    ></div>

    <!-- Grille : 1 col mobile, 2 cols tablette, 3 cols desktop -->
    <div :class="['grid gap-10 lg:gap-12 items-start', gridCols]">
      <article v-for="(doc, i) in documents" :key="doc.id" v-reveal="i * 120" class="flex flex-col w-full min-w-0">
        <h2 class="font-display mb-3 tracking-extra-wide leading-tight text-center" style="color: #111111; font-size: 23px;">
          {{ doc.title }}
        </h2>
        <div
          v-if="doc.description"
          class="rt-output mb-6 leading-relaxed tracking-wide text-center"
          style="color: #111111; font-size: 14px;"
          v-html="doc.description"
        ></div>

        <!-- Ancien PDF résiduel (legacy) : iframe + bouton zoom au-dessus -->
        <ClientOnly v-if="doc.file.mimeType === 'application/pdf'">
          <div class="relative group">
            <PdfViewer
              :src="`${apiUrl}/images/${doc.file.id}`"
              aspect-ratio="1 / 1.414"
              zoom="page-width"
            />
            <button
              type="button"
              @click="openZoom(doc)"
              class="absolute inset-0 cursor-zoom-in flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              style="background-color: rgba(0,0,0,0.15);"
              aria-label="Agrandir"
            >
              <span class="px-4 py-2 text-sm uppercase tracking-wider" style="background-color: #c39d63; color: #ffffff;">{{ $t('menu.zoom') }}</span>
            </button>
          </div>
          <template #fallback>
            <div class="bg-paper p-12 text-center tracking-wide" style="color: #666666;">Chargement…</div>
          </template>
        </ClientOnly>

        <!-- Image / PNG : cliquable pour zoom -->
        <img
          v-else
          :src="`${apiUrl}/images/${doc.file.id}`"
          :alt="doc.title"
          class="w-full h-auto block cursor-zoom-in transition-transform hover:scale-[1.02]"
          @click="openZoom(doc)"
        />
      </article>
    </div>

    <p v-if="!documents.length" class="text-center py-12 tracking-wide" style="color: #666666;">{{ $t('menu.noMenu') }}</p>

    <!-- ═════ Lightbox zoom (desktop) ═════ -->
    <Teleport to="body">
      <Transition name="zoom-fade">
        <div
          v-if="zoomDoc"
          class="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4 sm:p-8 cursor-zoom-out"
          @click="zoomDoc = null"
          @keydown.esc="zoomDoc = null"
          tabindex="0"
          ref="zoomRoot"
        >
          <button
            type="button"
            class="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white text-xl hover:opacity-70 transition"
            aria-label="Fermer"
            @click.stop="zoomDoc = null"
          >✕</button>
          <p class="absolute top-4 left-4 font-display text-white tracking-extra-wide text-lg">{{ zoomDoc.title }}</p>

          <!-- Image : taille naturelle, capée à 90vw × 85vh, aucune bande noire -->
          <img
            v-if="zoomDoc.file.mimeType !== 'application/pdf'"
            :src="`${apiUrl}/images/${zoomDoc.file.id}`"
            :alt="zoomDoc.title"
            class="block w-auto h-auto shadow-2xl"
            style="max-width: min(90vw, 700px); max-height: 85vh;"
            @click.stop
          />

          <!-- PDF legacy : iframe avec aspect-ratio A4 → pas de bandes -->
          <iframe
            v-else
            :src="`${apiUrl}/images/${zoomDoc.file.id}#zoom=page-fit&toolbar=0&navpanes=0&view=Fit`"
            class="bg-white shadow-2xl"
            style="width: min(90vw, 600px); aspect-ratio: 1 / 1.414; max-height: 85vh;"
            frameborder="0"
            @click.stop
          ></iframe>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.rt-output :deep(p) { margin: 0 0 0.5em; }
.rt-output :deep(p:last-child) { margin-bottom: 0; }
.rt-output :deep(div) { min-height: 1.8em; }
.rt-output :deep(p:empty), .rt-output :deep(div:empty) { min-height: 1.8em; }
.rt-output :deep(p:empty)::before, .rt-output :deep(div:empty)::before { content: '\00a0'; }
.rt-output :deep(ul), .rt-output :deep(ol) { padding-left: 1.4em; margin: 0.4em 0; text-align: left; display: inline-block; }
.rt-output :deep(b), .rt-output :deep(strong) { font-weight: 700; }
.rt-output :deep(em), .rt-output :deep(i) { font-style: italic; }

/* Lightbox transitions */
.zoom-fade-enter-active, .zoom-fade-leave-active { transition: opacity 0.2s ease; }
.zoom-fade-enter-from, .zoom-fade-leave-to { opacity: 0; }
</style>

<script setup lang="ts">
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl

const { data } = await useFetch<any[]>(`${apiUrl}/public/menu-documents`, { key: 'public-menu' })
const documents = computed(() => data.value ?? [])

const { data: siteRes } = await useFetch<Record<string, string>>(`${apiUrl}/public/site`, { key: 'public-site' })
const site = computed(() => siteRes.value ?? ({} as Record<string, string>))

// Lightbox zoom (desktop) — null = fermé
const zoomDoc = ref<any>(null)
const zoomRoot = ref<HTMLElement | null>(null)

function openZoom(doc: any) {
  zoomDoc.value = doc
  nextTick(() => zoomRoot.value?.focus())
}

// ESC global pour fermer
if (typeof window !== 'undefined') {
  onMounted(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') zoomDoc.value = null }
    window.addEventListener('keydown', onKey)
    onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
  })
}

// Mobile 1 col, tablette 2, desktop 3 (peu importe le nombre de menus)
const gridCols = computed(() => {
  const n = documents.value.length
  if (n === 1) return 'grid-cols-1 max-w-2xl mx-auto'
  if (n === 2) return 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto'
  return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
})

const { t: tT, locale: localeT } = useI18n()
useSeoMeta({
  title: () => localeT.value === 'fr'
    ? (site.value.seo_menu_title || `Menu — ${site.value.brand_name}`)
    : tT('seo.menuTitle', { brand: site.value.brand_name || '' }),
  description: () => localeT.value === 'fr'
    ? site.value.seo_menu_description
    : tT('seo.menuDescription', { brand: site.value.brand_name || '' }),
})
</script>
