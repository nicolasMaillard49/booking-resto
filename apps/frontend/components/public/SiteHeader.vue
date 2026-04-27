<template>
  <header class="fixed top-0 left-0 right-0 z-50 bg-canvas/90 backdrop-blur border-b border-line">
    <nav class="max-w-7xl mx-auto px-8 sm:px-12 py-6 flex items-center justify-between">
      <NuxtLink to="/" class="font-display text-xl font-medium tracking-extra-wide" style="color: #333333;">{{ brand }}</NuxtLink>
      <ul class="hidden lg:flex gap-12 text-sm tracking-extra-wide uppercase">
        <li><NuxtLink to="/" class="hover:opacity-80 transition" style="color: #666666;">Accueil</NuxtLink></li>
        <li><NuxtLink to="/menu" class="hover:opacity-80 transition" style="color: #666666;">Menu</NuxtLink></li>
        <li><NuxtLink to="/reservation" class="hover:opacity-80 transition" style="color: #666666;">Réserver</NuxtLink></li>
        <li><a href="/#contact" class="hover:opacity-80 transition" style="color: #666666;">Contact</a></li>
      </ul>
      <button class="lg:hidden text-2xl" style="color: #333333;" @click="open = !open" aria-label="Menu">☰</button>
    </nav>
    <div v-if="open" class="lg:hidden border-t border-line bg-canvas px-8 py-6 space-y-3">
      <NuxtLink to="/" @click="open=false" class="block py-2 tracking-wider" style="color: #666666;">Accueil</NuxtLink>
      <NuxtLink to="/menu" @click="open=false" class="block py-2 tracking-wider" style="color: #666666;">Menu</NuxtLink>
      <NuxtLink to="/reservation" @click="open=false" class="block py-2 tracking-wider" style="color: #666666;">Réserver</NuxtLink>
      <a href="/#contact" @click="open=false" class="block py-2 tracking-wider" style="color: #666666;">Contact</a>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{ brand: string }>()
const open = ref(false)
</script>
