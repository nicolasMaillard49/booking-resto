<template>
  <div class="max-w-5xl mx-auto px-8 sm:px-12 lg:px-16 pt-32 lg:pt-40 pb-20 lg:pb-28">
    <h1 class="font-display text-5xl sm:text-6xl lg:text-7xl text-center mb-20 tracking-extra-wide leading-tight text-heading">Nos menus</h1>

    <div v-for="doc in documents" :key="doc.id" class="mb-24 lg:mb-32">
      <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl mb-4 tracking-extra-wide leading-tight text-heading">{{ doc.title }}</h2>
      <p v-if="doc.description" class="text-ink mb-10 max-w-2xl leading-relaxed tracking-wide text-base sm:text-lg">{{ doc.description }}</p>

      <!-- PDF : rendu canvas via vue-pdf-embed (toutes les pages) -->
      <ClientOnly v-if="doc.file.mimeType === 'application/pdf'">
        <PdfEmbed :source="`${apiUrl}/images/${doc.file.id}`" class="border border-line bg-paper" />
        <a :href="`${apiUrl}/images/${doc.file.id}`" download class="inline-block mt-6 text-sm text-muted hover:text-heading underline tracking-wide">Télécharger le PDF</a>
        <template #fallback>
          <div class="bg-paper border border-line p-12 text-center text-muted tracking-wide">Chargement du PDF…</div>
        </template>
      </ClientOnly>

      <!-- Image : affichage direct -->
      <img v-else :src="`${apiUrl}/images/${doc.file.id}`" :alt="doc.title" class="w-full" />
    </div>

    <p v-if="!documents.length" class="text-center text-muted py-12 tracking-wide">Aucun menu publié pour le moment.</p>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl

const { data } = await useFetch<any[]>(`${apiUrl}/public/menu-documents`, { key: 'public-menu' })
const documents = computed(() => data.value ?? [])

const { data: siteRes } = await useFetch<Record<string, string>>(`${apiUrl}/public/site`, { key: 'public-site' })
const site = computed(() => siteRes.value ?? ({} as Record<string, string>))

useSeoMeta({
  title: site.value.seo_menu_title || `Menu — ${site.value.brand_name}`,
  description: site.value.seo_menu_description,
})
</script>
