<script setup lang="ts">
const config = useRuntimeConfig()
const { t, locale } = useI18n()

const [{ data: siteRes }, { data: sectionsRes }, { data: windowsRes }] = await Promise.all([
  useFetch<Record<string, string>>(`${config.public.apiUrl}/public/site`, { key: 'public-site' }),
  useFetch<any[]>(`${config.public.apiUrl}/public/home-sections`, { key: 'public-home-sections' }),
  useFetch<any[]>(`${config.public.apiUrl}/public/schedule`, { key: 'public-schedule' }),
])

const site = computed(() => siteRes.value ?? ({} as Record<string, string>))
const sections = computed(() => sectionsRes.value ?? [])
const windows = computed(() => windowsRes.value ?? [])

useSeoMeta({
  title: () => locale.value === 'fr'
    ? (site.value.seo_home_title || site.value.brand_name)
    : t('seo.homeTitle', { brand: site.value.brand_name || '' }),
  description: () => locale.value === 'fr'
    ? site.value.seo_home_description
    : t('seo.homeDescription', { brand: site.value.brand_name || '' }),
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
      :rating-value="site.rating_value"
      :rating-count="site.rating_count"
    />
    <HomeSection v-for="(s, i) in sections" :key="s.id" :section="s" :index="i" />
    <ReviewsCarousel
      :rating-value="site.rating_value"
      :rating-count="site.rating_count"
      :review-url="site.google_review_url"
    />
    <ContactBlock :site="site" :windows="windows" />
  </div>
</template>
