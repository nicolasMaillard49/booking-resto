<template>
  <footer class="border-t border-line py-12 text-center text-sm text-ink bg-canvas tracking-wider">
    <p>© {{ new Date().getFullYear() }} {{ brand }} — Site réalisé par <a href="https://www.nmf-agence.com" class="hover:text-heading underline">NMF Agence</a></p>
    <a v-if="instagram" :href="instagram" target="_blank" rel="noopener" class="inline-block mt-3 hover:text-heading">Instagram</a>
  </footer>
</template>

<script setup lang="ts">
defineProps<{ brand: string; instagram?: string }>()
</script>
