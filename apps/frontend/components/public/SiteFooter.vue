<template>
  <footer class="border-t border-line/10 py-8 text-center text-sm text-muted bg-canvas">
    <p>© {{ new Date().getFullYear() }} {{ brand }} — Site réalisé par <a href="https://www.nmf-agence.com" class="hover:text-ink underline">NMF Agence</a></p>
    <a v-if="instagram" :href="instagram" target="_blank" rel="noopener" class="inline-block mt-2 hover:text-ink">Instagram</a>
  </footer>
</template>

<script setup lang="ts">
defineProps<{ brand: string; instagram?: string }>()
</script>
