<template>
  <div class="space-y-4">
    <p v-if="loading" class="text-center py-12 text-muted tracking-wide">Chargement du PDF…</p>
    <p v-if="error" class="text-center py-12 text-red-700 tracking-wide">Impossible de charger le PDF</p>
    <VuePdfEmbed
      v-show="!loading && !error"
      :source="source"
      :width="width"
      annotation-layer
      text-layer
      @loaded="loading = false"
      @loading-failed="onError"
    />
  </div>
</template>

<script setup lang="ts">
import VuePdfEmbed from 'vue-pdf-embed'
import 'vue-pdf-embed/dist/styles/annotationLayer.css'
import 'vue-pdf-embed/dist/styles/textLayer.css'

defineProps<{ source: string }>()

const loading = ref(true)
const error = ref(false)
const width = ref(800)

function onError() {
  loading.value = false
  error.value = true
}

onMounted(() => {
  width.value = Math.min(window.innerWidth - 64, 1200)
  window.addEventListener('resize', () => {
    width.value = Math.min(window.innerWidth - 64, 1200)
  })
})
</script>
