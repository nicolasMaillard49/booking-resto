<template>
  <section class="relative h-[80vh] min-h-[500px] w-full overflow-hidden bg-heading">
    <img v-if="imageUrl" :src="imageUrl" :alt="title" class="absolute inset-0 w-full h-full object-cover" />
    <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60"></div>
    <div class="relative z-10 h-full flex flex-col items-center justify-center text-center text-canvas px-8 sm:px-12 md:px-20">
      <h1 class="font-display text-5xl sm:text-6xl lg:text-7xl font-light mb-6 tracking-extra-wide leading-tight">{{ title }}</h1>
      <p v-if="subtitle" class="text-lg sm:text-xl max-w-2xl mb-12 opacity-90 font-light tracking-wide">{{ subtitle }}</p>
      <div class="flex flex-col sm:flex-row gap-4">
        <NuxtLink to="/menu" class="px-10 py-4 bg-canvas text-heading hover:bg-paper transition border border-canvas tracking-wide">Menu</NuxtLink>
        <NuxtLink to="/reservation" class="px-10 py-4 border border-canvas text-canvas hover:bg-canvas hover:text-heading transition tracking-wide">Réserver</NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ title: string; subtitle?: string; imageId?: string | null }>()
const config = useRuntimeConfig()
const imageUrl = computed(() => props.imageId ? `${config.public.apiUrl}/images/${props.imageId}` : null)
</script>
