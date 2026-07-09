// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  css: ['primeicons/primeicons.css', '~/assets/css/main.css'],
  modules: ['@primevue/nuxt-module', '@pinia/nuxt', '@vite-pwa/nuxt'],
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
      display: 'standalone',
      start_url: '/',
    },
  },
})
