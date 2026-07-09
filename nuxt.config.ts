// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  css: ['primeicons/primeicons.css', '~/assets/css/main.css'],
  modules: ['@primevue/nuxt-module', '@pinia/nuxt', '@vite-pwa/nuxt'],
  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      title: 'NgekosKuy',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800&display=swap',
        },
      ],
    },
  },
  primevue: {
    importTheme: { from: '@/themes/app-theme' },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1',
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'NgekosKuy',
      short_name: 'NgekosKuy',
      theme_color: '#523724',
      background_color: '#f4f5f7',
      display: 'standalone',
      start_url: '/',
    },
  },
})
