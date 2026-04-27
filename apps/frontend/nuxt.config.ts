// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@vueuse/nuxt', '@nuxtjs/i18n'],

  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'fr',
    locales: [
      { code: 'fr', iso: 'fr-FR', name: 'Français', file: 'fr.json' },
      { code: 'en', iso: 'en-US', name: 'English',  file: 'en.json' },
      { code: 'es', iso: 'es-ES', name: 'Español',  file: 'es.json' },
      { code: 'it', iso: 'it-IT', name: 'Italiano', file: 'it.json' },
      { code: 'de', iso: 'de-DE', name: 'Deutsch',  file: 'de.json' },
    ],
    // lazy: false → bundle-in tous les JSON. Évite "Failed locale loading: IPC connection closed"
    // que provoque parfois vite-node en dev sur Windows.
    lazy: false,
    langDir: 'locales/',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'fr',
    },
    bundle: { optimizeTranslationDirective: false },
  },

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
          href: 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Playfair+Display+SC:ital,wght@0,400;0,700;0,900;1,400&family=Nunito:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap',
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
