<template>
  <header class="sticky top-0 z-30 bg-canvas/95 backdrop-blur border-b border-line/10">
    <nav class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <NuxtLink to="/" class="font-display text-xl font-semibold tracking-tight">{{ brand }}</NuxtLink>
      <ul class="hidden md:flex gap-8 text-sm">
        <li><NuxtLink to="/" class="hover:text-muted">Accueil</NuxtLink></li>
        <li><NuxtLink to="/menu" class="hover:text-muted">Menu</NuxtLink></li>
        <li><NuxtLink to="/reservation" class="hover:text-muted">Réserver</NuxtLink></li>
        <li><a href="/#contact" class="hover:text-muted">Contact</a></li>
      </ul>
      <button class="md:hidden text-2xl" @click="open = !open" aria-label="Menu">☰</button>
    </nav>
    <div v-if="open" class="md:hidden border-t border-line/10 bg-canvas px-6 py-4 space-y-2">
      <NuxtLink to="/" @click="open=false" class="block py-2">Accueil</NuxtLink>
      <NuxtLink to="/menu" @click="open=false" class="block py-2">Menu</NuxtLink>
      <NuxtLink to="/reservation" @click="open=false" class="block py-2">Réserver</NuxtLink>
      <a href="/#contact" @click="open=false" class="block py-2">Contact</a>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{ brand: string }>()
const open = ref(false)
</script>
