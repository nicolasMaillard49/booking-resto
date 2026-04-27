<template>
  <footer class="border-t border-line py-12 px-6 text-center text-sm bg-canvas tracking-wider" style="color: #333333;">
    <!-- Réseaux sociaux : icônes seules -->
    <div v-if="socials.length" class="flex justify-center gap-5 mb-6">
      <a
        v-for="s in socials"
        :key="s.name"
        :href="s.url"
        :aria-label="s.name"
        target="_blank"
        rel="noopener"
        class="hover:opacity-70 transition"
        style="color: #333333;"
      >
        <component :is="s.icon" :size="22" :stroke-width="1.6" />
      </a>
    </div>

    <p>© {{ new Date().getFullYear() }} {{ brand }} — {{ $t('footer.madeBy') }} <a href="https://www.nmf-agence.com" class="hover:opacity-70 transition-opacity underline font-bold" style="color: #333333;">NMF Agence</a></p>
  </footer>
</template>

<script setup lang="ts">
import { Instagram, Facebook, Twitter, Youtube } from 'lucide-vue-next'
import type { Component } from 'vue'

const props = defineProps<{
  brand: string
  instagram?: string
  facebook?: string
  tiktok?: string
  twitter?: string
  youtube?: string
  tripadvisor?: string
  thefork?: string
}>()

// Icônes inline SVG pour TikTok / TripAdvisor / TheFork (pas dans lucide)
const TiktokIcon: Component = {
  render: () => h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'currentColor' }, [
    h('path', { d: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.45a8.16 8.16 0 0 0 4.77 1.52V6.51a4.84 4.84 0 0 1-1.84-.18Z' }),
  ]),
}
const TripadvisorIcon: Component = {
  render: () => h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6 }, [
    h('circle', { cx: 8, cy: 13, r: 3 }),
    h('circle', { cx: 16, cy: 13, r: 3 }),
    h('circle', { cx: 8, cy: 13, r: 0.8, fill: 'currentColor' }),
    h('circle', { cx: 16, cy: 13, r: 0.8, fill: 'currentColor' }),
    h('path', { d: 'M3 13a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5M7.5 8 12 5l4.5 3' }),
  ]),
}
const TheforkIcon: Component = {
  render: () => h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8 }, [
    h('path', { d: 'M7 2v8a3 3 0 0 0 6 0V2M10 10v12M16 2c-1.5 2-2 4-2 6s.5 4 2 5v9' }),
  ]),
}

const socials = computed(() => [
  { name: 'Instagram', url: props.instagram, icon: Instagram },
  { name: 'Facebook',  url: props.facebook,  icon: Facebook },
  { name: 'TikTok',    url: props.tiktok,    icon: TiktokIcon },
  { name: 'X',         url: props.twitter,   icon: Twitter },
  { name: 'YouTube',   url: props.youtube,   icon: Youtube },
  { name: 'TripAdvisor', url: props.tripadvisor, icon: TripadvisorIcon },
  { name: 'TheFork',   url: props.thefork,   icon: TheforkIcon },
].filter(s => s.url?.trim()))
</script>
