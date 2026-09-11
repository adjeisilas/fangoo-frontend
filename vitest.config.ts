import { defineVitestConfig } from '@nuxt/test-utils/config';

/**
 * Unit tests run in happy-dom against the real composables and components.
 *
 * Deliberately not the full Nuxt runtime environment: booting Nuxt per file is slow
 * enough that the suite stops being run, and everything covered here is logic that
 * does not need a server. Anything that genuinely needs the app running is checked
 * by the browser scripts instead.
 */
export default defineVitestConfig({
  test: {
    environment: 'happy-dom',
    include: ['app/**/*.spec.ts'],
    globals: true,
  },
});
