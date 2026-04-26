<template>
  <div class="min-h-screen bg-canvas text-ink font-sans flex flex-col">
    <SiteHeader :brand="site?.brand_name ?? 'Mon Restaurant'" />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter :brand="site?.brand_name ?? 'Mon Restaurant'" :instagram="site?.instagram_url" />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const { data: site } = await useFetch<Record<string, string>>(`${config.public.apiUrl}/public/site`)
</script>
