<template>
  <div class="max-w-4xl mx-auto px-6 py-16">
    <h1 class="font-display text-5xl md:text-6xl text-center mb-16 tracking-tight">Nos menus</h1>
    <div v-for="doc in documents" :key="doc.id" class="mb-20">
      <h2 class="font-display text-3xl md:text-4xl mb-3 tracking-tight">{{ doc.title }}</h2>
      <p v-if="doc.description" class="text-muted mb-8 max-w-2xl">{{ doc.description }}</p>
      <template v-if="doc.file.mimeType === 'application/pdf'">
        <embed :src="`${apiUrl}/images/${doc.file.id}`" type="application/pdf" class="w-full h-[800px] border border-line/10" />
        <a :href="`${apiUrl}/images/${doc.file.id}`" download class="inline-block mt-4 text-sm text-muted hover:text-ink underline">Télécharger le PDF</a>
      </template>
      <template v-else>
        <img :src="`${apiUrl}/images/${doc.file.id}`" :alt="doc.title" class="w-full" />
      </template>
    </div>
    <p v-if="!documents.length" class="text-center text-muted py-12">Aucun menu publié pour le moment.</p>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl

const { data } = await useFetch<any[]>(`${apiUrl}/public/menu-documents`)
const documents = computed(() => data.value ?? [])

const { data: siteRes } = await useFetch<Record<string, string>>(`${apiUrl}/public/site`)
const site = computed(() => siteRes.value ?? {})

useSeoMeta({
  title: site.value.seo_menu_title || `Menu — ${site.value.brand_name}`,
  description: site.value.seo_menu_description,
})
</script>
