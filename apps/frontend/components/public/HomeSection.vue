<template>
  <section class="grid lg:grid-cols-2 min-h-[60vh] lg:min-h-[80vh]">
    <div :class="['relative overflow-hidden min-h-[50vh] lg:min-h-0', reversed ? 'lg:order-2' : '']">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="section.title"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div v-else class="absolute inset-0 bg-line"></div>
    </div>

    <div class="flex items-center justify-center px-8 sm:px-16 lg:px-24 py-20 lg:py-32 bg-canvas">
      <div class="max-w-xl">
        <h2 class="font-display text-4xl sm:text-5xl lg:text-6xl mb-8 tracking-extra-wide leading-tight text-heading">{{ section.title }}</h2>
        <div class="prose prose-stone max-w-none whitespace-pre-line text-base sm:text-lg leading-relaxed text-ink tracking-wide">{{ section.body }}</div>
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
