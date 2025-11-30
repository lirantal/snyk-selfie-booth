// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  runtimeConfig: {
    // Private keys (only available on server-side)
    geminiApiKey: process.env.GEMINI_API_KEY,
    // Public keys (exposed to client-side)
    public: {}
  }
})


