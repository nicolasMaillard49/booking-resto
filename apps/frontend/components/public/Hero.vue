<template>
  <section class="relative h-[80vh] min-h-[500px] w-full overflow-hidden bg-ink">
    <img v-if="imageUrl" :src="imageUrl" :alt="title" class="absolute inset-0 w-full h-full object-cover opacity-90" />
    <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60"></div>
    <div class="relative z-10 h-full flex flex-col items-center justify-center text-center text-canvas px-6">
      <h1 class="font-display text-5xl md:text-7xl font-light mb-4 tracking-tight">{{ title }}</h1>
      <p v-if="subtitle" class="text-lg md:text-xl max-w-2xl mb-10 opacity-90 font-light">{{ subtitle }}</p>
      <div class="flex gap-4">
        <NuxtLink to="/menu" class="px-8 py-3 bg-canvas text-ink hover:bg-paper transition border border-canvas">Menu</NuxtLink>
        <NuxtLink to="/reservation" class="px-8 py-3 border border-canvas text-canvas hover:bg-canvas hover:text-ink transition">Réserver</NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ title: string; subtitle?: string; imageId?: string | null }>()
const config = useRuntimeConfig()
const imageUrl = computed(() => props.imageId ? `${config.public.apiUrl}/images/${props.imageId}` : null)
</script>
