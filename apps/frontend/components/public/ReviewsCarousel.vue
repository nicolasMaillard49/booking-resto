<template>
  <section class="bg-canvas py-20 lg:py-28 overflow-hidden">
    <div class="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
      <div v-reveal class="text-center mb-12">
        <p class="text-xs uppercase tracking-mega-wide mb-3" style="color: #c39d63;">{{ $t('reviews.kicker') }}</p>
        <h2 class="font-display tracking-extra-wide leading-tight mb-4" style="color: #111111; font-size: clamp(28px, 5vw, 42px);">
          {{ $t('reviews.title') }}
        </h2>
        <div class="flex items-center justify-center gap-2 mb-2">
          <span class="flex gap-0.5">
            <svg v-for="i in 5" :key="i" width="18" height="18" viewBox="0 0 24 24" fill="#c39d63">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </span>
          <span class="text-sm font-semibold" style="color: #111111;">{{ ratingValue || '5' }}/5</span>
          <span class="text-sm" style="color: #666666;">· {{ $t('reviews.basedOn', { count: ratingCount || '150' }) }}</span>
        </div>
      </div>

      <!-- Carousel -->
      <div v-reveal="120" class="relative">
        <!-- Boutons nav -->
        <button
          type="button"
          @click="scroll(-1)"
          class="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-12 h-12 items-center justify-center bg-paper border border-line shadow-md hover:shadow-lg hover:scale-105 transition-all"
          aria-label="Précédent"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="1.6">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          @click="scroll(1)"
          class="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-12 h-12 items-center justify-center bg-paper border border-line shadow-md hover:shadow-lg hover:scale-105 transition-all"
          aria-label="Suivant"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="1.6">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>

        <!-- Track scrollable -->
        <div
          ref="trackRef"
          class="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-6 px-6 lg:-mx-2 lg:px-2 reviews-track"
        >
          <article
            v-for="(r, i) in reviews"
            :key="i"
            class="snap-start flex-shrink-0 w-[85%] sm:w-[60%] md:w-[420px] bg-paper border border-line p-6 sm:p-8 flex flex-col"
          >
            <!-- Header : nom + meta -->
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 flex items-center justify-center font-semibold text-sm" style="background-color: #c39d63; color: #ffffff;">
                {{ r.name.charAt(0) }}
              </div>
              <div>
                <p class="font-semibold text-sm" style="color: #111111;">{{ r.name }}</p>
                <p class="text-xs" style="color: #999999;">{{ r.meta }}</p>
              </div>
            </div>
            <!-- Stars -->
            <div class="flex gap-0.5 mb-3">
              <svg v-for="s in 5" :key="s" width="14" height="14" viewBox="0 0 24 24" fill="#c39d63">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <!-- Texte -->
            <p class="text-sm leading-relaxed flex-1" style="color: #444444;">{{ r.text }}</p>
          </article>
        </div>
      </div>

      <!-- CTA laisser un avis (toujours visible, désactivé si URL manquante) -->
      <div v-reveal="240" class="mt-12 text-center">
        <a
          v-if="reviewUrl"
          :href="reviewUrl"
          target="_blank"
          rel="noopener"
          class="btn-cta-gold text-sm"
        >
          ⭐ {{ $t('reviews.leaveReview') }}
        </a>
        <button
          v-else
          type="button"
          class="btn-cta-gold text-sm opacity-60 cursor-not-allowed"
          disabled
          :title="'URL Google Avis non configurée dans /admin/parametres'"
        >
          ⭐ {{ $t('reviews.leaveReview') }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ ratingValue?: string; ratingCount?: string; reviewUrl?: string }>()

// Avis d'exemple (template) — adapte ce tableau à tes vrais avis Google
// Plus tard : possibilité de les rendre éditables depuis l'admin (model Review).
const reviews = [
  {
    name: 'Marie L.',
    meta: 'Local Guide · 25 avis',
    text: 'Une belle découverte, accueil chaleureux et cuisine pleine de saveurs. Le rapport qualité-prix est excellent, on reviendra avec plaisir !',
  },
  {
    name: 'Thomas D.',
    meta: '12 avis · 3 photos',
    text: 'Excellente soirée dans ce restaurant. Les plats sont travaillés avec finesse et les produits sont de très belle qualité. Service attentif et discret.',
  },
  {
    name: 'Sophie B.',
    meta: '8 avis · 5 photos',
    text: "Adresse à recommander sans hésiter. La carte change régulièrement, on sent l'attention portée à la saison et au terroir. Bravo à toute l'équipe.",
  },
  {
    name: 'Julien M.',
    meta: 'Local Guide · 40 avis',
    text: 'Cadre agréable, plats créatifs et service impeccable. Une vraie expérience gastronomique à un prix raisonnable. Nous reviendrons.',
  },
  {
    name: 'Camille R.',
    meta: '6 avis · 2 photos',
    text: "Cuisine inventive et produits de qualité. L'équipe est passionnée, ça se ressent dans l'assiette. Mention spéciale pour les desserts !",
  },
  {
    name: 'Laurent P.',
    meta: '15 avis · 8 photos',
    text: "Un excellent moment, accueil souriant et chaleureux. Les plats sont beaux, savoureux et bien dosés. Une adresse qui devient incontournable dans le quartier.",
  },
]

const trackRef = ref<HTMLElement | null>(null)
let autoScrollTimer: number | null = null

function scroll(dir: number) {
  if (!trackRef.value) return
  const card = trackRef.value.querySelector('article') as HTMLElement | null
  const step = (card?.offsetWidth ?? 400) + 24
  const max = trackRef.value.scrollWidth - trackRef.value.clientWidth
  let next = trackRef.value.scrollLeft + dir * step
  // Boucle infinie : retour au début si on dépasse la fin
  if (next >= max - 4) next = 0
  if (next < 0) next = max
  trackRef.value.scrollTo({ left: next, behavior: 'smooth' })
}

if (typeof window !== 'undefined') {
  onMounted(() => {
    // Défilement auto toutes les 4s
    autoScrollTimer = window.setInterval(() => scroll(1), 4000)
    // Pause au survol pour ne pas déranger la lecture
    const stop = () => { if (autoScrollTimer) { clearInterval(autoScrollTimer); autoScrollTimer = null } }
    const start = () => {
      if (autoScrollTimer) return
      autoScrollTimer = window.setInterval(() => scroll(1), 4000)
    }
    trackRef.value?.addEventListener('mouseenter', stop)
    trackRef.value?.addEventListener('mouseleave', start)
    onBeforeUnmount(() => {
      stop()
      trackRef.value?.removeEventListener('mouseenter', stop)
      trackRef.value?.removeEventListener('mouseleave', start)
    })
  })
}
</script>

<style scoped>
.reviews-track::-webkit-scrollbar { height: 4px; }
.reviews-track::-webkit-scrollbar-thumb { background: #cccccc; }
</style>
