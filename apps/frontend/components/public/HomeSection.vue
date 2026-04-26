<template>
  <section class="py-20 md:py-28 px-6">
    <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center" :class="reversed ? 'md:[&>:first-child]:order-2' : ''">
      <div>
        <img v-if="imageUrl" :src="imageUrl" :alt="section.title" class="w-full aspect-[4/5] object-cover" />
        <div v-else class="w-full aspect-[4/5] bg-paper border border-line/10"></div>
      </div>
      <div>
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
