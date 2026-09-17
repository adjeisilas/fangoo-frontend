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
    /**
     * Server-only API address for server-side rendering (NUXT_API_BASE_SERVER).
     * Empty means `public.apiBase` is used everywhere. Needed only when the public
     * URL is not reachable from the web server itself: in docker-compose,
     * `localhost:4200` inside the web container is not the API.
     */
    apiBaseServer: '',
    public: {
      apiBase: 'http://localhost:4000/api/v1',
      /**
       * Absolute origin used for canonicals, og:url, sitemap and robots.
       *
       * Deliberately localhost, not a real domain: a default that names a domain
       * makes every canonical tag advertise it, whether or not that domain is
       * ours. Localhost is truthful in development and is rejected outright by
       * the production boot guard, so a deploy has to state its own origin.
       */
      siteUrl: 'http://localhost:3000',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      // Titles, descriptions, canonicals and robots are owned per page by `useSeo`.
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        // The green of the Fangoo app icon, so the mobile browser bar matches it.
        { name: 'theme-color', content: '#03633D' },
      ],
      link: [
        // Generated from app/assets/brand/fangoo-icon-512.png.
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', sizes: '16x16 32x32 48x48' },
        { rel: 'icon', type: 'image/png', href: '/icon-192.png', sizes: '192x192' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
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
