<template>
  <section class="relative h-screen w-full overflow-hidden" style="background-color: #1f1f1f;">
    <img v-if="imageUrl" :src="imageUrl" :alt="title" class="absolute inset-0 w-full h-full object-cover" />
    <div class="absolute inset-0" style="background-color: rgba(0,0,0,0.65);"></div>
    <div class="relative z-10 h-full flex flex-col items-center justify-center text-center px-8 sm:px-12 md:px-20" style="color: #ffffff;">
      <h1 class="font-display text-5xl sm:text-6xl lg:text-8xl font-light mb-8 tracking-extra-wide leading-tight drop-shadow-lg">{{ title }}</h1>
      <p v-if="subtitle" class="text-lg sm:text-xl max-w-2xl mb-14 opacity-95 font-light tracking-wide drop-shadow">{{ subtitle }}</p>
      <div class="flex flex-col sm:flex-row gap-4">
        <NuxtLink to="/menu" class="px-12 py-4 transition tracking-wider uppercase text-sm" style="background-color: #c39d63; color: #ffffff;">Menu</NuxtLink>
        <NuxtLink to="/reservation" class="px-12 py-4 border transition tracking-wider uppercase text-sm" style="border-color: #c39d63; color: #ffffff;">Réserver</NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ title: string; subtitle?: string; imageId?: string | null }>()
const config = useRuntimeConfig()
const imageUrl = computed(() => props.imageId ? `${config.public.apiUrl}/images/${props.imageId}` : null)
</script>
