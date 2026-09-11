/**
 * Served dynamically so the sitemap URL always matches the deployed origin
 * (NUXT_PUBLIC_SITE_URL) rather than a hardcoded domain.
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const siteUrl = String(config.public.siteUrl).replace(/\/+$/, '');

  // Authenticated and transactional areas: nothing here is useful in search,
  // and some of it is per-user.
  const disallowed = [
    '/admin/',
    '/supplier/',
    '/orders',
    '/orders/',
    '/requests',
    '/requests/',
    '/checkout/',
    '/login',
    '/register',
  ];

  const body = [
    'User-agent: *',
    ...disallowed.map((path) => `Disallow: ${path}`),
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');

  setHeader(event, 'content-type', 'text/plain; charset=utf-8');
  setHeader(event, 'cache-control', 'public, max-age=3600');

  return body;
});
