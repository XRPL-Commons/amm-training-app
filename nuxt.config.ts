// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/color-mode', 'nuxt-icon'],
  plugins: [],
  runtimeConfig: {
    // The private keys which are only available server-side
    wssExplorer: process.env.WSS_EXPLORER,
    adminPassword: process.env.ADMIN_PASSWORD,
    // Keys within public are also exposed client-side
    public: {
      apiBase: '/api',
      network: process.env.NETWORK
    }
  },
  ssr: false,
  css: [
    '~/assets/fonts/clash-display.css',
  ]
})