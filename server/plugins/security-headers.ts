/**
 * Response headers the app itself needs.
 *
 * The API sets these on its own responses, but a browser applies them per
 * document: without them here, any site could load a Fangoo page — including the
 * dashboards — inside a frame and act through a signed-in session.
 *
 * No Content-Security-Policy yet: Nuxt hydration and the Google Fonts stylesheet
 * need one written and tested against the built pages, which is worth doing on
 * its own rather than shipping a policy that half-works.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event) => {
    setResponseHeaders(event, {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    });

    // Only in production. A browser ignores HSTS sent over plain http, but there
    // is no reason to advertise it from a development server either.
    if (!import.meta.dev) {
      setResponseHeader(
        event,
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
    }
  });
});
