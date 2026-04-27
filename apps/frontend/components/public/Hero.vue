<template>
  <section ref="rootRef" class="relative h-screen w-full overflow-hidden" style="background-color: #1f1f1f;">
    <!-- Image bg : plus grande que le viewport (130% en hauteur) ; scroll = révèle progressivement le bas -->
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="title"
      class="absolute left-0 right-0 top-0 w-full object-cover will-change-transform"
      :style="imageStyle"
    />

    <!-- Filtre sombre constant -->
    <div class="absolute inset-0" style="background-color: rgba(0,0,0,0.55);"></div>

    <!-- Contenu : remonte + fade au scroll -->
    <div
      class="relative z-10 h-full flex flex-col items-center justify-center text-center px-8 sm:px-12 md:px-20 will-change-[transform,opacity]"
      :style="contentStyle"
    >
      <h1 class="font-display text-5xl sm:text-6xl lg:text-8xl font-light mb-4 tracking-extra-wide leading-tight drop-shadow-lg" style="color: #ffffff;">{{ title }}</h1>

      <!-- Badge : étoiles + nombre d'avis -->
      <div v-if="ratingCount" class="flex items-center gap-2 mb-8 drop-shadow">
        <span class="flex gap-0.5">
          <svg v-for="i in 5" :key="i" width="16" height="16" viewBox="0 0 24 24" :fill="i <= Math.round(Number(ratingValue || 5)) ? '#c39d63' : 'rgba(255,255,255,0.3)'">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </span>
        <span class="text-xs sm:text-sm tracking-wider" style="color: #ffffff;">
          {{ $t('hero.reviewCount', { count: ratingCount }) }}
        </span>
      </div>

      <p v-if="subtitle" class="text-lg sm:text-xl max-w-2xl mb-14 font-light tracking-wide drop-shadow" style="color: #ffffff;">{{ subtitle }}</p>
      <div class="flex flex-col sm:flex-row gap-3">
        <NuxtLink :to="localePath('/menu')" class="btn-cta-gold text-xs">{{ $t('hero.menu') }}</NuxtLink>
        <NuxtLink :to="localePath('/reservation')" class="btn-cta-outline text-xs">{{ $t('hero.reserve') }}</NuxtLink>
      </div>
    </div>

    <!-- Indicateur scroll cliquable (chevron animé) qui disparaît au scroll -->
    <button
      type="button"
      @click="scrollToNext"
      class="discover-btn"
      :class="{ 'is-bouncing': progress < 0.4 }"
      :style="{ opacity: clamp(1 - progress * 2.5, 0, 1), pointerEvents: progress >= 0.4 ? 'none' : 'auto' }"
      aria-label="Découvrir la suite"
    >
      <span class="text-xs uppercase tracking-mega-wide" style="color: #ffffff;">{{ $t('hero.discover') }}</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.5">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ title: string; subtitle?: string; imageId?: string | null; ratingValue?: string; ratingCount?: string }>()
const config = useRuntimeConfig()
const localePath = useLocalePath()
const imageUrl = computed(() => props.imageId ? `${config.public.apiUrl}/images/${props.imageId}` : null)

const rootRef = ref<HTMLElement | null>(null)
const progress = ref(0)            // 0 → 1 sur la première viewport scrollée
let rafId: number | null = null

function clamp(n: number, min = 0, max = 1) { return Math.max(min, Math.min(max, n)) }

function scrollToNext() {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
}

function onScroll() {
  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    if (typeof window === 'undefined') return
    const h = window.innerHeight || 1
    progress.value = clamp(window.scrollY / h)
  })
}

onMounted(() => {
  if (typeof window === 'undefined') return
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('scroll', onScroll)
  if (rafId !== null) cancelAnimationFrame(rafId)
})

// Image : 130% de hauteur, top-aligned ; translateY négatif progressif → révèle le bas de l'image au scroll
const imageStyle = computed(() => ({
  height: '130%',
  transform: `translate3d(0, ${-progress.value * 30}%, 0)`,
}))

// Contenu : fade + slide up
const contentStyle = computed(() => ({
  opacity: String(clamp(1 - progress.value * 1.6)),
  transform: `translate3d(0, ${-progress.value * 60}px, 0)`,
}))
</script>

<style scoped>
.discover-btn {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  background: transparent;
  border: 0;
  pointer-events: auto;
  transition: opacity 0.2s linear;
}
.discover-btn:hover { opacity: 0.7; }

/* Animation bounce sur un wrapper interne pour ne pas casser le translate centrant */
.discover-btn > * {
  pointer-events: none;
}
.discover-btn.is-bouncing > * {
  animation: bounce-slow 2.4s ease-in-out infinite;
}
@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
</style>
