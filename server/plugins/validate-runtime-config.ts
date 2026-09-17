import { runtimeConfigErrors } from '../../app/composables/useRuntimeGuards.js';

/**
 * Refuses to start a production server that is pointing at the wrong place.
 *
 * The defaults in `nuxt.config.ts` are development conveniences that point both
 * `apiBase` and `siteUrl` at localhost. Neither is validated by Nuxt, so a
 * deploy that forgets `NUXT_PUBLIC_API_BASE` builds
 * cleanly, serves cleanly, and then asks every visitor's browser to call
 * `localhost:4000` — their own machine. Nothing appears in the server logs,
 * because the failure happens in the visitor's browser.
 *
 * The backend already fails its own boot on missing configuration
 * (`src/config/env.validation.ts`); this is the front end's half of that bargain.
 */
export default defineNitroPlugin(() => {
  // `import.meta.dev` is false for `nuxt build` output, which is what ships.
  if (import.meta.dev) return;

  const config = useRuntimeConfig();
  const errors = runtimeConfigErrors(
    {
      apiBase: config.public?.apiBase,
      siteUrl: config.public?.siteUrl,
      apiBaseServer: config.apiBaseServer,
    },
    {
      // Read from process.env, not runtimeConfig, so it can never be baked into
      // the client bundle. Set only by the docker-compose parity stack.
      allowLocalUrls: process.env.FANGOO_ALLOW_LOCAL_URLS === 'true',
    },
  );

  if (errors.length > 0) {
    throw new Error(
      `Invalid runtime configuration:\n  - ${errors.join('\n  - ')}\n` +
        'Set these before starting the production server.',
    );
  }
});
