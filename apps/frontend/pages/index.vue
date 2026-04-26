<script setup lang="ts">
const config = useRuntimeConfig()

const [{ data: siteRes }, { data: sectionsRes }, { data: windowsRes }] = await Promise.all([
  useFetch<Record<string, string>>(`${config.public.apiUrl}/public/site`),
  useFetch<any[]>(`${config.public.apiUrl}/public/home-sections`),
  useFetch<any[]>(`${config.public.apiUrl}/public/schedule`),
])

const site = computed(() => siteRes.value ?? ({} as Record<string, string>))
const sections = computed(() => sectionsRes.value ?? [])
const windows = computed(() => windowsRes.value ?? [])

useSeoMeta({
  title: site.value.seo_home_title || site.value.brand_name,
  description: site.value.seo_home_description,
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: site.value.brand_name,
      address: site.value.contact_address,
      telephone: site.value.contact_phone,
      email: site.value.contact_email,
    }),
  }],
})
</script>

<template>
  <div>
    <Hero
      :title="site.hero_title || 'Bienvenue'"
      :subtitle="site.hero_subtitle"
      :image-id="site.hero_image_id || null"
    />
    <HomeSection v-for="(s, i) in sections" :key="s.id" :section="s" :index="i" />
    <ContactBlock :site="site" :windows="windows" />
  </div>
</template>
