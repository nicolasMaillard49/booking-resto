<template>
  <div class="min-h-screen bg-canvas text-ink font-sans flex flex-col">
    <SiteHeader :brand="site?.brand_name ?? 'Mon Restaurant'" />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter
      :brand="site?.brand_name ?? 'Mon Restaurant'"
      :instagram="site?.instagram_url"
      :facebook="site?.facebook_url"
      :tiktok="site?.tiktok_url"
      :twitter="site?.twitter_url"
      :youtube="site?.youtube_url"
      :tripadvisor="site?.tripadvisor_url"
      :thefork="site?.thefork_url"
    />

    <!-- Bouton flottant Réserver (toujours visible en bas à droite) -->
    <NuxtLink
      v-if="!isReservationPage"
      :to="localePath('/reservation')"
      class="floating-cta fixed bottom-6 right-6 z-40 px-4 py-1.5 uppercase tracking-wider text-xs font-sans"
      :aria-label="$t('contact.reserveTable')"
    >
      {{ $t('hero.reserve') }}
    </NuxtLink>

    <ToastContainer />
    <ClientOnly><PopupModal /></ClientOnly>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()
const localePath = useLocalePath()
const { data: site } = await useFetch<Record<string, string>>(`${config.public.apiUrl}/public/site`, {
  // Cache court : settings peuvent changer souvent depuis l'admin
  key: 'public-site',
  server: true,
})

const isReservationPage = computed(() => /\/reservation\b/.test(route.path))
</script>

<style scoped>
.floating-cta {
  background-color: #c39d63;
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
  transition: transform 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
}
.floating-cta:hover {
  transform: translateY(-2px);
  background-color: #b58c52;
  box-shadow: 0 8px 18px rgba(195, 157, 99, 0.45);
}
</style>
