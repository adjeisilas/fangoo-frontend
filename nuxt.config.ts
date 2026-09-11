// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  // Point the module at our own entry so Tailwind is injected exactly once.
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: '~~/tailwind.config.ts',
  },
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:4000/api/v1',
      // Absolute origin used for canonicals, og:url, sitemap and robots.
      // Override per environment with NUXT_PUBLIC_SITE_URL.
      siteUrl: 'https://fangoo.com',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      // Titles, descriptions, canonicals and robots are owned per page by `useSeo`.
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0C1322' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@500;600;700;800&display=swap',
        },
      ],
    },
  },
});
