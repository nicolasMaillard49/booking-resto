// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@vueuse/nuxt'],

  components: [
    { path: '~/components', pathPrefix: false },
    { path: '~/components/public', pathPrefix: false },
    { path: '~/components/admin', prefix: 'Admin' },
  ],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3101',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3100',
    },
  },

  // SSR activé pour le SEO
  ssr: true,

  // Admin zone: CSR uniquement, pas d'indexation
  routeRules: {
    '/admin/**': {
      ssr: false,
      headers: { 'X-Robots-Tag': 'noindex, nofollow' },
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&family=JetBrains+Mono:wght@400;500;600&display=swap',
        },
      ],
    },
  },

  tailwindcss: {
    configPath: 'tailwind.config.ts',
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  // Sitemap auto (si @nuxtjs/sitemap installé)
  // sitemap: { hostname: process.env.NUXT_PUBLIC_SITE_URL },
})
