<template>
  <header class="sticky top-0 z-30 bg-canvas/95 backdrop-blur border-b border-line">
    <nav class="max-w-7xl mx-auto px-8 sm:px-12 py-6 flex items-center justify-between">
      <NuxtLink to="/" class="font-display text-xl font-medium tracking-extra-wide text-heading">{{ brand }}</NuxtLink>
      <ul class="hidden lg:flex gap-12 text-sm tracking-extra-wide uppercase">
        <li><NuxtLink to="/" class="text-ink hover:text-heading transition">Accueil</NuxtLink></li>
        <li><NuxtLink to="/menu" class="text-ink hover:text-heading transition">Menu</NuxtLink></li>
        <li><NuxtLink to="/reservation" class="text-ink hover:text-heading transition">Réserver</NuxtLink></li>
        <li><a href="/#contact" class="text-ink hover:text-heading transition">Contact</a></li>
      </ul>
      <button class="lg:hidden text-2xl text-heading" @click="open = !open" aria-label="Menu">☰</button>
    </nav>
    <div v-if="open" class="lg:hidden border-t border-line bg-canvas px-8 py-6 space-y-3">
      <NuxtLink to="/" @click="open=false" class="block py-2 text-ink hover:text-heading tracking-wider">Accueil</NuxtLink>
      <NuxtLink to="/menu" @click="open=false" class="block py-2 text-ink hover:text-heading tracking-wider">Menu</NuxtLink>
      <NuxtLink to="/reservation" @click="open=false" class="block py-2 text-ink hover:text-heading tracking-wider">Réserver</NuxtLink>
      <a href="/#contact" @click="open=false" class="block py-2 text-ink hover:text-heading tracking-wider">Contact</a>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{ brand: string }>()
const open = ref(false)
</script>
