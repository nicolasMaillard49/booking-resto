<template>
  <header class="fixed top-0 left-0 right-0 z-50 bg-canvas/90 backdrop-blur border-b border-line">
    <nav class="max-w-7xl mx-auto px-8 sm:px-12 py-6 flex items-center justify-between gap-6">
      <NuxtLink :to="localePath('/')" class="font-display text-2xl font-semibold tracking-extra-wide hover:opacity-70 transition-opacity" style="color: #111111;">{{ brand }}</NuxtLink>
      <ul class="hidden lg:flex gap-12 text-base font-display font-light tracking-extra-wide">
        <li><NuxtLink :to="localePath('/')" class="hover:opacity-70 transition-opacity" style="color: #111111;">{{ $t('nav.home') }}</NuxtLink></li>
        <li><NuxtLink :to="localePath('/menu')" class="hover:opacity-70 transition-opacity" style="color: #111111;">{{ $t('nav.menu') }}</NuxtLink></li>
        <li><NuxtLink :to="localePath('/reservation')" class="hover:opacity-70 transition-opacity" style="color: #111111;">{{ $t('nav.reservation') }}</NuxtLink></li>
        <li><a :href="localePath('/') + '#contact'" class="hover:opacity-70 transition-opacity" style="color: #111111;">{{ $t('nav.contact') }}</a></li>
      </ul>

      <div class="hidden lg:block"><LangSwitcher /></div>

      <button class="lg:hidden text-2xl hover:opacity-70 transition-opacity" style="color: #333333;" @click="open = !open" :aria-label="$t('nav.menu')">☰</button>
    </nav>
    <div v-if="open" class="lg:hidden border-t border-line bg-canvas px-8 py-6 space-y-3">
      <NuxtLink :to="localePath('/')" @click="open=false" class="block py-2 font-display font-light tracking-extra-wide text-base hover:opacity-70 transition-opacity" style="color: #111111;">{{ $t('nav.home') }}</NuxtLink>
      <NuxtLink :to="localePath('/menu')" @click="open=false" class="block py-2 font-display font-light tracking-extra-wide text-base hover:opacity-70 transition-opacity" style="color: #111111;">{{ $t('nav.menu') }}</NuxtLink>
      <NuxtLink :to="localePath('/reservation')" @click="open=false" class="block py-2 font-display font-light tracking-extra-wide text-base hover:opacity-70 transition-opacity" style="color: #111111;">{{ $t('nav.reservation') }}</NuxtLink>
      <a :href="localePath('/') + '#contact'" @click="open=false" class="block py-2 font-display font-light tracking-extra-wide text-base hover:opacity-70 transition-opacity" style="color: #111111;">{{ $t('nav.contact') }}</a>
      <div class="pt-2 border-t border-line"><LangSwitcher /></div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{ brand: string }>()
const localePath = useLocalePath()
const open = ref(false)
</script>
