<template>
  <Teleport to="body">
    <Transition name="popup-fade">
      <div
        v-if="visible && popup"
        class="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4 sm:p-6"
        @click.self="close"
      >
        <div class="relative bg-canvas max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <!-- Bouton fermer -->
          <button
            type="button"
            @click="close"
            class="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center hover:opacity-70 transition"
            :style="popup.image ? 'color: #ffffff; background-color: rgba(0,0,0,0.4);' : 'color: #111111;'"
            aria-label="Fermer"
          >
            ✕
          </button>

          <!-- Image plein écran si présente -->
          <img
            v-if="popup.image"
            :src="`${apiUrl}/images/${popup.image.id}`"
            :alt="popup.title"
            class="block w-full h-auto"
          />

          <!-- Contenu -->
          <div class="p-6 sm:p-8 text-center" :class="popup.image ? '' : 'pt-12'">
            <h3
              class="font-display tracking-extra-wide leading-tight mb-4"
              style="color: #111111; font-size: clamp(22px, 4vw, 32px);"
            >
              {{ popup.title }}
            </h3>
            <div
              class="rt-output leading-relaxed tracking-wide max-w-md mx-auto"
              style="color: #333333; font-size: 15px;"
              v-html="popup.body"
            ></div>
            <a
              v-if="popup.ctaLabel && popup.ctaUrl"
              :href="popup.ctaUrl"
              @click="close"
              class="inline-block mt-6 px-8 py-3 transition tracking-wider uppercase text-sm font-sans"
              style="background-color: #c39d63; color: #ffffff;"
            >
              {{ popup.ctaLabel }}
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl

const popup = ref<any>(null)
const visible = ref(false)

const SESSION_KEY_PREFIX = 'popup_seen_'

onMounted(async () => {
  if (typeof window === 'undefined') return
  try {
    const data: any = await $fetch(`${apiUrl}/public/popup`)
    if (!data) return
    popup.value = data

    // Si "showOncePerSession" et déjà vue → skip
    if (data.showOncePerSession) {
      const seen = sessionStorage.getItem(SESSION_KEY_PREFIX + data.id)
      if (seen) return
    }

    if (data.trigger === 'AFTER_DELAY' && data.delaySeconds > 0) {
      setTimeout(show, data.delaySeconds * 1000)
    } else {
      show()
    }
  } catch { /* silent */ }
})

function show() {
  visible.value = true
}

function close() {
  visible.value = false
  if (popup.value?.showOncePerSession) {
    sessionStorage.setItem(SESSION_KEY_PREFIX + popup.value.id, '1')
  }
}
</script>

<style scoped>
.popup-fade-enter-active, .popup-fade-leave-active { transition: opacity 0.3s ease; }
.popup-fade-enter-from, .popup-fade-leave-to { opacity: 0; }
.rt-output :deep(p) { margin: 0 0 0.6em; }
.rt-output :deep(p:last-child) { margin-bottom: 0; }
.rt-output :deep(div) { min-height: 1.6em; }
.rt-output :deep(p:empty), .rt-output :deep(div:empty) { min-height: 1.6em; }
.rt-output :deep(p:empty)::before, .rt-output :deep(div:empty)::before { content: '\00a0'; }
.rt-output :deep(ul), .rt-output :deep(ol) { padding-left: 1.4em; margin: 0.4em 0; text-align: left; display: inline-block; }
.rt-output :deep(b), .rt-output :deep(strong) { font-weight: 700; }
.rt-output :deep(em), .rt-output :deep(i) { font-style: italic; }
</style>
