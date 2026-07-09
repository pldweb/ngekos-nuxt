import Aura from '@primeuix/themes/aura'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  css: ['primeicons/primeicons.css', '~/assets/css/main.css'],
  modules: ['@primevue/nuxt-module', '@pinia/nuxt', '@vite-pwa/nuxt'],
  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: { darkModeSelector: '.dark-mode' },
      },
    },
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
      theme_color: '#0ea5e9',
      display: 'standalone',
      start_url: '/',
    },
  },
})
