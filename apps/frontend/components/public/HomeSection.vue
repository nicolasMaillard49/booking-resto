<template>
  <!-- ═════ Layout SPLIT (image + texte côte à côte) ═════ -->
  <section v-if="section.layout !== 'FULL'" class="grid lg:grid-cols-2" :style="bgStyle">
    <!-- IMAGE -->
    <div
      :class="[
        'flex items-stretch justify-center',
        'order-2',
        reversed ? 'lg:order-2' : 'lg:order-1',
      ]"
      :style="bgStyle"
    >
      <img
        v-if="imageUrl"
        v-reveal
        :src="imageUrl"
        :alt="localized.title"
        class="block w-full h-auto max-h-screen object-cover object-center lg:h-full"
      />
    </div>

    <!-- TEXTE -->
    <div
      :class="[
        'flex items-center justify-center px-6 sm:px-10 lg:px-16 py-10 lg:py-8',
        'order-1',
        reversed ? 'lg:order-1' : 'lg:order-2',
      ]"
    >
      <div class="w-full max-w-xl text-center">
        <h2
          v-reveal
          class="font-display tracking-extra-wide leading-tight mb-6 lg:whitespace-nowrap"
          :style="{ color: textColor, fontSize: 'clamp(24px, 4vw, 42px)' }"
        >
          {{ localized.title }}
        </h2>
        <div
          v-reveal="120"
          class="rt-output font-body antialiased"
          :style="{
            color: isDark(bgColor) ? '#f5f5f5' : '#666666',
            fontSize: '16px',
            fontWeight: 500,
            lineHeight: '1.8em',
          }"
          v-html="localized.body"
        ></div>
        <a
          v-if="localized.ctaLabel && section.ctaUrl"
          v-reveal="240"
          :href="section.ctaUrl"
          class="inline-block mt-8 px-8 py-3 transition tracking-wider uppercase text-sm font-sans hover:scale-105"
          style="background-color: #c39d63; color: #ffffff; transition: transform 0.25s ease, opacity 700ms ease-out;"
        >
          {{ localized.ctaLabel }}
        </a>
      </div>
    </div>
  </section>

  <!-- ═════ Layout FULL (largeur totale, contenu centré, sobre — pas de bg image qui imite le hero) ═════ -->
  <section
    v-else
    class="relative py-16 lg:py-24 px-6 sm:px-10 lg:px-16"
    :style="bgStyle"
  >
    <div class="max-w-3xl mx-auto text-center">
      <h2
        v-reveal
        class="font-display tracking-extra-wide leading-tight mb-6 lg:whitespace-nowrap"
        :style="{ color: textColor, fontSize: 'clamp(24px, 4vw, 42px)' }"
      >
        {{ localized.title }}
      </h2>
      <div
        v-reveal="120"
        class="rt-output font-body antialiased max-w-2xl mx-auto"
        :style="{
          color: isDark(bgColor) ? '#f5f5f5' : '#666666',
          fontSize: '16px',
          fontWeight: 500,
          lineHeight: '1.8em',
        }"
        v-html="localized.body"
      ></div>

      <!-- Image optionnelle sous le texte (pas en bg, pour ne pas imiter le hero) -->
      <img
        v-if="imageUrl"
        v-reveal="180"
        :src="imageUrl"
        :alt="localized.title"
        class="block mx-auto mt-8 max-w-full h-auto max-h-[40vh] w-auto"
      />

      <a
        v-if="localized.ctaLabel && section.ctaUrl"
        v-reveal="240"
        :href="section.ctaUrl"
        class="btn-cta-gold mt-8 text-sm"
      >
        {{ localized.ctaLabel }}
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
interface SectionTranslation { title?: string; body?: string; ctaLabel?: string }
interface SectionData {
  id: string
  title: string
  body: string
  layout?: 'SPLIT' | 'FULL'
  bgColor?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  translations?: Record<string, SectionTranslation> | null
  image?: { id: string } | null
}
const props = defineProps<{ section: SectionData; index: number }>()
const config = useRuntimeConfig()
const { locale } = useI18n()

const reversed = computed(() => props.index % 2 === 0)

const imageUrl = computed(() =>
  props.section.image?.id ? `${config.public.apiUrl}/images/${props.section.image.id}` : null,
)

// Sélectionne la traduction pour la locale courante (fallback FR par défaut)
const localized = computed(() => {
  const t = props.section.translations?.[locale.value]
  return {
    title: t?.title || props.section.title,
    body: t?.body || props.section.body,
    ctaLabel: t?.ctaLabel || props.section.ctaLabel || '',
  }
})

// Background color (custom ou défaut canvas #f5f5f5)
const bgColor = computed(() => props.section.bgColor?.trim() || '#f5f5f5')

const bgStyle = computed(() => `background-color: ${bgColor.value};`)

// Couleur du texte adaptative : sombre sur fond clair, clair sur fond sombre
const textColor = computed(() => isDark(bgColor.value) ? '#f5f5f5' : '#111111')

function isDark(hex: string): boolean {
  const v = hex.replace('#', '')
  const full = v.length === 3 ? v.split('').map(c => c + c).join('') : v.slice(0, 6)
  if (full.length !== 6) return false
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  // Luminance perçue
  return (r * 0.299 + g * 0.587 + b * 0.114) < 140
}
</script>

<style scoped>
.rt-output :deep(p) { margin: 0 0 0.6em; }
.rt-output :deep(p:last-child) { margin-bottom: 0; }
.rt-output :deep(div) { min-height: 1.8em; }                                              /* préserve la hauteur des sauts de ligne */
.rt-output :deep(p:empty), .rt-output :deep(div:empty) { min-height: 1.8em; }             /* lignes vides visibles */
.rt-output :deep(p:empty)::before, .rt-output :deep(div:empty)::before { content: '\00a0'; } /* nbsp pour forcer la hauteur */
.rt-output :deep(br) { display: block; content: ''; margin-top: 0; }
.rt-output :deep(ul), .rt-output :deep(ol) { padding-left: 1.4em; margin: 0.4em 0; text-align: left; display: inline-block; }
.rt-output :deep(b), .rt-output :deep(strong) { font-weight: 700; }
.rt-output :deep(em), .rt-output :deep(i) { font-style: italic; }
</style>
