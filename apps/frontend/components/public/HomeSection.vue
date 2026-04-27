<template>
  <section class="grid md:grid-cols-2 min-h-[60vh] md:min-h-[70vh]">
    <!-- Image (50% width sur desktop, full sur mobile, zoomée pour remplir) -->
    <div :class="['relative overflow-hidden', reversed ? 'md:order-2' : '']">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="section.title"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div v-else class="absolute inset-0 bg-paper border border-line/10"></div>
    </div>

    <!-- Texte (50% width, padding intérieur uniquement) -->
    <div class="flex items-center justify-center px-6 sm:px-10 md:px-16 py-16 md:py-0 bg-canvas">
      <div class="max-w-lg">
        <h2 class="font-display text-4xl md:text-5xl mb-6 tracking-tight">{{ section.title }}</h2>
        <div class="prose prose-stone max-w-none whitespace-pre-line text-base leading-relaxed text-ink/80">{{ section.body }}</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface SectionData { id: string; title: string; body: string; image?: { id: string } | null }
const props = defineProps<{ section: SectionData; index: number }>()
const config = useRuntimeConfig()
const reversed = computed(() => props.index % 2 === 1)
const imageUrl = computed(() => props.section.image?.id ? `${config.public.apiUrl}/images/${props.section.image.id}` : null)
</script>
